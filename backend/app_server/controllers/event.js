const { ObjectId } = require('mongodb');
const Event = require('../models/event');
const Timeline = require('../models/timeline');
const { sendResponse } = require('../utilities/helping_functions');
const Papa = require('papaparse');
const { utils, write } = require('xlsx');


const orderType = { ASCENDING: 'ASCENDING', DESCENDING: 'DESCENDING' };

exports.createEvent = async (req, res) => {
    try {
        const { date, timelineId } = req.body;

        if (!date || !timelineId) {
            sendResponse(res, 400, { 'result': 'failed', 'message': 'date, timelineId are required' });
            return;
        }

        const event = new Event({ ...req.body, timelineId });
        const newEvent = await event.save();
        await Timeline.updateOne({ _id: timelineId }, { $inc: { 'totalEvents': 1 } });
        sendResponse(res, 201, { 'result': 'success', '_id': newEvent._id });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.createEvents = async (req, res) => {
    try {
        const { timelineId, newEvents } = req.body;

        if (!newEvents || !timelineId || (newEvents && newEvents.length === 0)) {
            sendResponse(res, 400, { 'result': 'failed', 'message': 'timelineId & newEvents are required and newEvents should have at least one object' });
            return;
        }

        const savedEvents = await Event.insertMany(newEvents);
        await Timeline.updateOne({ _id: timelineId }, { $inc: { 'totalEvents': savedEvents.length } });
        sendResponse(res, 201, { 'result': 'success' });
    }
    catch (err) {
        console.log(err)
        sendResponse(res, 500, err);
    }
}

exports.editEvent = async (req, res) => {
    try {
        const { _id, date } = req.body;

        if (!_id || !date) {
            sendResponse(res, 400, { 'result': 'failed', 'message': '_id & date are required' });
            return;
        }

        req.body.date = {
            ...req.body.date,
            formattedDate: req.body.date.date // typeof req.body.date.date is string, its needed to update formattedDate as cliend side doesn't send updated formattedDate 
        }

        const eventToEdit = await Event.findOne({ _id });
        await Event.replaceOne({ _id }, {
            ...req.body,
            timelineId: eventToEdit.timelineId,
            createdAt: eventToEdit.createdAt,
        });
        sendResponse(res, 200, { 'result': 'success' });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.deleteEvent = async (req, res) => {
    try {
        const { _id, timelineId } = req.body;

        if (!_id || !timelineId) {
            sendResponse(res, 400, { 'result': 'failed', 'message': '_id, timelineId are required' });
            return;
        }

        const result = await Event.deleteOne({ _id });
        if (result.deletedCount !== 0) {
            await Timeline.updateOne({ _id: timelineId }, { $inc: { 'totalEvents': -1 } });
        }

        sendResponse(res, 204);
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.getSortFields = async (req, res) => {
    try {
        const { timelineId } = req.params;
        const result = await Event.aggregate([
            {
                $match: {
                    'timelineId': new ObjectId(timelineId)
                }
            },
            {
                $project: {
                    fields: { $objectToArray: '$$ROOT' }
                }
            },
            {
                $unwind: '$fields'
            },
            {
                $group: {
                    _id: null,
                    uniqueFields: { $addToSet: '$fields.k' }
                }
            },
            {
                $project: {
                    _id: 0,
                    uniqueFields: 1
                }
            }
        ]);
        sendResponse(res, 201, { 'result': 'success', 'sortFields': result[0]?.uniqueFields?.filter((field) => field !== 'timelineId' && field !== 'createdAt' && field !== 'updatedAt' && field !== '__v' && field !== '_id') || [] });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.getTimelineEvents = async (req, res) => {
    try {
        const limit = 200;
        const { timelineId, skip, time } = req.params;

        const query = getQuery(req.body);
        query.timelineId = timelineId;
        query.createdAt = { $lte: new Date(Number(time)) };
        const sortQuery = getSortQuery(req.body)

        const events = await Event.find(query).collation({ locale: "en", strength: 2 }).sort(sortQuery).skip(Number(skip)).limit(limit).select('-timelineId -createdAt -updatedAt -__v');

        const formattedEvents = events.map(event => {
            const dayWithLeadingZero = event.date.date.getDate().toString().padStart(2, '0');
            const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(event.date.date);
            const year = event.date.date.getFullYear();

            const formattedDate = `${month} ${dayWithLeadingZero}, ${year}`;

            return {
                ...event.toObject(),
                date: {
                    ...event.date,
                    date: formattedDate
                }
            };
        });

        sendResponse(res, 201, { 'result': 'success', 'events': formattedEvents });
    }
    catch (err) {
        console.log(err)
        sendResponse(res, 500, err);
    }
}

function getQuery({ searchValue, excludedValue, startDate, endDate, attributeValueSwitch,
    excludedValueSwitch, dateSwitch, uniqueFields,
    specificAttributeValueSwitch, attributeExcludedValueSwitch, specificAttribute, searchValueBySpecificAttribute,
    specificAttributeForExcludedValue, searchExcludedValueBySpecificAttribute }) {
    let query = {};
    uniqueFields = uniqueFields.concat(['date.name', 'date.formattedDate'])
    if (attributeValueSwitch && searchValue) {
        const searchRegex = new RegExp(searchValue.trim(), 'i');
        query.$or = uniqueFields.map((field) => ({ [field]: { $regex: searchRegex } }));
    }

    if (specificAttributeValueSwitch && specificAttribute && searchValueBySpecificAttribute) {
        if (specificAttribute === 'date') {
            query['date.formattedDate'] = { $regex: new RegExp(searchValueBySpecificAttribute.trim(), 'i') };
        }
        else {
            query[specificAttribute] = { $regex: new RegExp(searchValueBySpecificAttribute.trim(), 'i') };
        }
    }

    if (excludedValueSwitch && excludedValue) {
        const excludedRegex = new RegExp(excludedValue.trim(), 'i');
        query.$nor = uniqueFields.map((field) => ({ [field]: { $regex: excludedRegex } }));
    }

    if (attributeExcludedValueSwitch && specificAttributeForExcludedValue && searchExcludedValueBySpecificAttribute) {
        if (specificAttributeForExcludedValue === 'date') {
            query['date.formattedDate'] = { ...query['date.formattedDate'], $not: { $regex: new RegExp(searchExcludedValueBySpecificAttribute.trim(), 'i') } };
        }
        else {
            query[specificAttributeForExcludedValue] = {
                ...query[specificAttributeForExcludedValue],
                $not: { $regex: new RegExp(searchExcludedValueBySpecificAttribute.trim(), 'i') }
            };
        }
    }
    console.log(query)

    if (dateSwitch && startDate) {
        query['date.date'] = { $gte: new Date(startDate) };
    }

    if (dateSwitch && endDate) {
        query['date.date'] = { ...query['date.date'], $lte: new Date(endDate) };
    }

    return query;
}

function getSortQuery({ sortBy, sortSwitch, sortOrder }) {
    const sortQuery = {};
    if (sortSwitch && sortBy) {
        if (sortOrder === orderType.ASCENDING) {
            sortQuery[sortBy !== 'date' ? sortBy : 'date.date'] = sortBy === 'date' ? 1 : 'asc';
        } else {
            sortQuery[sortBy !== 'date' ? sortBy : 'date.date'] = sortBy === 'date' ? -1 : 'desc';
        }
    }

    if (Object.keys(sortQuery).length === 0) {
        sortQuery['date.date'] = 1;
    }

    return sortQuery;
}

exports.exportCSV = async (req, res) => {
    try {
        const { timelineId, fileName } = req.params;

        const events = await Event.aggregate([
            {
                $match: {
                    'timelineId': new ObjectId(timelineId)
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { $arrayToObject: [[{ k: '$date.name', v: '$date.formattedDate' }]] },
                            { $arrayToObject: { $objectToArray: '$$ROOT' } }
                        ]
                    }
                }
            },
            {
                $unset: ['_id', 'timelineId', 'date', 'createdAt', 'updatedAt', '__v']
            }
        ]);

        const result = await Event.aggregate([
            {
                $match: {
                    'timelineId': new ObjectId(timelineId)
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { $arrayToObject: [[{ k: '$date.name', v: '$date.formattedDate' }]] },
                            { $arrayToObject: { $objectToArray: '$$ROOT' } }
                        ]
                    }
                }
            },
            {
                $project: {
                    fields: { $objectToArray: '$$ROOT' }
                }
            },
            {
                $unwind: '$fields'
            },
            {
                $group: {
                    _id: null,
                    uniqueFields: { $addToSet: '$fields.k' }
                }
            },
            {
                $project: {
                    _id: 0,
                    uniqueFields: 1
                }
            }
        ]);
        const csvHeader = result[0]?.uniqueFields?.filter((field) => !['_id', 'timelineId', 'date', 'createdAt', 'updatedAt', '__v'].includes(field)) || [];

        const csv = Papa.unparse({ fields: csvHeader, data: events });

        // Set headers for CSV download
        res.header('Content-Type', 'text/csv');
        res.attachment(fileName + '.csv');
        res.status(201);
        res.send(csv);

    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.exportXLSX = async (req, res) => {
    try {
        const { timelineId, fileName } = req.params;

        const events = await Event.aggregate([
            {
                $match: {
                    'timelineId': new ObjectId(timelineId)
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { $arrayToObject: [[{ k: '$date.name', v: '$date.formattedDate' }]] },
                            { $arrayToObject: { $objectToArray: '$$ROOT' } }
                        ]
                    }
                }
            },
            {
                $unset: ['_id', 'timelineId', 'date', 'createdAt', 'updatedAt', '__v']
            }
        ]);

        const result = await Event.aggregate([
            {
                $match: {
                    'timelineId': new ObjectId(timelineId)
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { $arrayToObject: [[{ k: '$date.name', v: '$date.formattedDate' }]] },
                            { $arrayToObject: { $objectToArray: '$$ROOT' } }
                        ]
                    }
                }
            },
            {
                $project: {
                    fields: { $objectToArray: '$$ROOT' }
                }
            },
            {
                $unwind: '$fields'
            },
            {
                $group: {
                    _id: null,
                    uniqueFields: { $addToSet: '$fields.k' }
                }
            },
            {
                $project: {
                    _id: 0,
                    uniqueFields: 1
                }
            }
        ]);
        const header = result[0]?.uniqueFields?.filter((field) => !['_id', 'timelineId', 'date', 'createdAt', 'updatedAt', '__v'].includes(field)) || [];

        const workbook = utils.book_new();
        const worksheet = utils.json_to_sheet(events, { header });
        utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

        const buffer = write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.status(201);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + fileName + '.xlsx');
        res.send(buffer);
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.getAllHeaders = async (req, res) => {
    try {
        const { timelineId } = req.params;

        const result = await Event.aggregate([
            {
                $match: {
                    'timelineId': new ObjectId(timelineId)
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            { $arrayToObject: [[{ k: '$date.name', v: '$date.formattedDate' }]] },
                            { $arrayToObject: { $objectToArray: '$$ROOT' } }
                        ]
                    }
                }
            },
            {
                $project: {
                    fields: { $objectToArray: '$$ROOT' }
                }
            },
            {
                $unwind: '$fields'
            },
            {
                $group: {
                    _id: null,
                    uniqueFields: { $addToSet: '$fields.k' }
                }
            },
            {
                $project: {
                    _id: 0,
                    uniqueFields: 1
                }
            }
        ]);
        const headers = result[0]?.uniqueFields?.filter((field) => !['_id', 'timelineId', 'date', 'createdAt', 'updatedAt', '__v'].includes(field)) || [];
        sendResponse(res, 201, { 'result': 'success', 'headers': headers });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.getAnalyticsData = async (req, res) => {
    try {
        const { timelineId, option } = req.params;

        const events = await Event.find({ timelineId }).lean().select('-_id -timelineId -createdAt -updatedAt -__v');
        // const result = await Event.aggregate([
        //     {
        //         $match: {
        //             'timelineId': new ObjectId(timelineId)
        //         }
        //     },
        //     {
        //         $project: {
        //             fields: { $objectToArray: '$$ROOT' }
        //         }
        //     },
        //     {
        //         $unwind: '$fields'
        //     },
        //     {
        //         $group: {
        //             _id: null,
        //             uniqueFields: { $addToSet: '$fields.k' }
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             uniqueFields: 1
        //         }
        //     }
        // ]);
        // const uniqueFields = result[0]?.uniqueFields?.filter((field) => field !== 'timelineId' && field !== 'createdAt' && field !== 'updatedAt' && field !== '__v' && field !== '_id') || [];
        // const chartData = uniqueFields.reduce((acc, fieldName) => {
        //     const fieldChartData = generateChartData(events, fieldName);
        //     return { ...acc, ...fieldChartData };
        // }, {});

        const chartData = generateChartData(events, option);
        sendResponse(res, 201, { result: 'success', data: chartData });
    }
    catch (error) {
        sendResponse(res, 500, error);
    }
}

const generateChartData = (data, fieldName) => {
    const values = [];
    data.forEach((item) => {
        if (!item[fieldName]) {
            return;
        }
        if (item[fieldName] && fieldName !== 'date' && typeof item[fieldName] === 'string' && item[fieldName].includes(';')) {
            values.push(item[fieldName].split(';').map(value => value.trim()));
        } else if (fieldName === 'date') {
            values.push(item[fieldName].formattedDate);
        } else {
            values.push(item[fieldName]);
        }
    });

    const flattenedValues = values.flat();
    const uniqueValues = [...new Set(flattenedValues)];

    const pieChartData = [];
    const barChartData = [];

    for (let i = 0; i < uniqueValues.length; i++) {
        pieChartData.push({
            name: uniqueValues[i],
            fieldName,
            value: flattenedValues.filter((v) => v === uniqueValues[i]).length,
            fill: getRandomColor(),
        })
        barChartData.push({
            name: uniqueValues[i],
            [fieldName]: flattenedValues.filter((v) => v === uniqueValues[i]).length,
            fill: getRandomColor(),
        })
    };

    return { [fieldName]: { [`${fieldName}_pie`]: pieChartData, [`${fieldName}_bar`]: barChartData } };
};

const getRandomColor = () => {
    // Function to generate random color for chart elements
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

exports.getComparingChartData = async (req, res) => {
    try {
        const { timelineId, option1, option2 } = req.params;

        const events = await Event.find({ timelineId }).lean().select('-_id -timelineId -createdAt -updatedAt -__v');
        const chartData = generateComparingChartData(events, option1, option2);
        sendResponse(res, 201, { result: 'success', data: chartData });
    }
    catch (error) {
        if (error.message === 'yaxis_error') {
            sendResponse(res, 400, { 'message': 'Y-Axis field\'s column should contains numerical values' });
        }
        else {
            sendResponse(res, 500, error);
        }
    }
}

const generateComparingChartData = (data, xFieldName, yFieldName) => {
    const values = [];
    data.forEach((item) => {
        if (!item[xFieldName] || !item[yFieldName]) {
            return;
        }

        item[yFieldName] = Number(item[yFieldName]);

        if (isNaN(item[yFieldName])) {
            throw new Error('yaxis_error');
        }

        values.push({
            xValue: xFieldName !== 'date' ? item[xFieldName] : item[xFieldName].formattedDate,
            yValue: item[yFieldName]
        });

    });

    const uniqueXValues = [...new Set(values.map(item => item.xValue))];

    const pieChartData = [];
    const barChartData = [];

    uniqueXValues.forEach((xValue) => {
        const dataPoints = values.filter(item => item.xValue === xValue);
        const totalYValue = dataPoints.reduce((acc, item) => acc + item.yValue, 0);

        pieChartData.push({
            name: xValue,
            fieldName: yFieldName,
            value: totalYValue,
            fill: getRandomColor(),
        });

        barChartData.push({
            name: xValue,
            [yFieldName]: totalYValue,
            fill: getRandomColor(),
        });
    });

    return { [yFieldName]: { [`${yFieldName}_pie`]: pieChartData, [`${yFieldName}_bar`]: barChartData } };
};
