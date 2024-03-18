const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema({
    _id:{
        type:Number
    },
    model: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('counters', saveSchema)