const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

// Create Schema
const landSchema = new Schema({
    // _id: {
    //     type: Schema.Types.ObjectId,
    //     required: true
    // },
    // userId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: true,
    //     ref: 'users'
    // },
    certificateNum: {
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
});


const LandList = mongoose.model('LandList', landSchema);

module.exports = LandList;