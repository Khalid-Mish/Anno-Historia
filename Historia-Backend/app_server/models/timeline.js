const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const timelineSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    totalEvents: {
        type: Number,
        default: 0
    },
    userId: {
        type: ObjectId,
        required: true,
        ref: 'User'
    }
}, { timestamps: true });



const Timeline = mongoose.model('Timeline', timelineSchema);
module.exports = Timeline;