const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

// Create Schema
const blockSchema = new Schema({
    blockIndex: {
        type: Number,
        required: true
    },
    blockTime: {
        type: Date,
        required: true,
        default: Date.now()
    },
    transactions: [{
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
            ref: 'users'
        }
    }],
    nonce: {
        type: Number,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    previousBlockHash: {
        type: String,
        required: true
    }
});


const Block = mongoose.model('Block', blockSchema);

module.exports = Block;