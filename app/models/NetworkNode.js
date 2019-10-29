const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

// Create Schema
const networkSchema = new Schema({
    node_url: {
        type: String,
        required: true
    }
});


const Block = mongoose.model('NetworkNode', networkSchema);

module.exports = Block;