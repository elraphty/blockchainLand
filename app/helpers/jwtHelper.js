const bcrypt = require('bcrypt');

module.exports.sign = (data) => {
    // delete user password
    delete data.password;

    let token = jwt.sign(data,
        process.env.TOKEN_SECRET,
        {
            expiresIn: 1000 * 60 * 60 * 24 * 31,
            jwtid: uuidv4(),
        });
    return token;
}

module.exports.verify = (data, callback) => {
    jwt.verify(data, process.env.TOKEN_SECRET, function (err, res) {
        if (err) return callback(err, false);
        else if (res.expiresIn > Date.now()) {

            let err = {
                status: 403,
                message: 'Sorry aunthenticatiom error, try to log in again'
            }

            return callback(err, false);
        }
        return callback(false, res);
    })
}