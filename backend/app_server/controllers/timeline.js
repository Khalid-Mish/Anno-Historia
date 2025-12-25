const Timeline = require('../models/timeline');
const Event = require('../models/event');
const { sendResponse } = require('../utilities/helping_functions');
const mongoose = require('mongoose');

exports.createTimeline = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            sendResponse(res, 400, { 'result': 'failed', 'message': 'name is required' });
            return;
        }

        const timeline = new Timeline({ name, userId: req.user._id });
        const newTimeline = await timeline.save();
        sendResponse(res, 201, { 'result': 'success', '_id': newTimeline._id });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.getAllTimelines = async (req, res) => {
    try {
        const timelines = await Timeline.find({ userId: req.user._id });
        sendResponse(res, 201, { 'result': 'success', 'timelines': timelines });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.deleteTimeline = async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { _id } = req.body;
            if (!_id) {
                sendResponse(res, 400, { 'result': 'failed', 'message': '_id is required' });
                return;
            }

            await Timeline.deleteOne({ _id });
            await Event.deleteMany({ timelineId: _id });
            await session.commitTransaction();

            sendResponse(res, 204);
        }
        catch (err) {
            await session.abortTransaction();
            throw err;
        }
        finally {
            session.endSession();
        }

    } catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.editTimeline = async (req, res) => {
    try {
        const { _id, name } = req.body;

        if (!_id || !name) {
            sendResponse(res, 400, { 'result': 'failed', 'message': '_id & name are required' });
            return;
        }

        await Timeline.updateOne({ _id }, { name });
        sendResponse(res, 200, { 'result': 'success' });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

