const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

// Create Schema
const userSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});


const User = mongoose.model('User', userSchema);

module.exports = User;