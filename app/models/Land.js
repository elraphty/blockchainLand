const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

// Create Schema
const landSchema = new Schema({
    landId: {
        type: String,
        required: true
    },
    familyName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    coordinates: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
});


const Land = mongoose.model('Land', landSchema);

module.exports = Land;