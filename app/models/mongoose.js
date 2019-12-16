const mongoose = require('mongoose');

// Using Global Promise for Mongoose
mongoose.Promise = global.Promise;

mongoose.connect("mongodb+srv://elraphty:Elraphty1@desertcolonel-1-7nh9k.mongodb.net/blockchain", {
    useNewUrlParser: true
})
    .then(() => { console.log("MongoDb connected") })
    .catch(err => console.log(err));

module.exports = mongoose;