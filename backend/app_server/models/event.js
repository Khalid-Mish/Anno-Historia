const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    date: {
        name: {
            type: String,
            required: true,
            default: 'date',
        },
        date: {
            type: Date,
            required: true
        },
        formattedDate: {
            type: String,
            default: function () {
                return formattedEvents(this.date.date);
            },
        }
    },
    timelineId: {
        type: ObjectId,
        required: true,
        ref: 'Timeline'
    },
}, { timestamps: true, strict: false });

const formattedEvents = (date) => {
    const dayWithLeadingZero = date.getDate().toString().padStart(2, '0');
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    const year = date.getFullYear();

    const formattedDate = `${month} ${dayWithLeadingZero}, ${year}`;

    return formattedDate
};

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;