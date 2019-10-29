const bcrypt = require('bcrypt');

module.exports.hash = (password) => {
    let hash = bcrypt.hashSync(password, 10);
    return hash;
}

module.exports.verify = (password, hash) => {
    return bcrypt.compareSync(password, hash); 
}

