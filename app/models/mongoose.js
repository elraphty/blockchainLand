const mongoose = require('mongoose');

// Using Global Promise for Mongoose
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true
})
    .then(() => { console.log("MongoDb connected") })
    .catch(err => console.log(err));

module.exports = mongoose;