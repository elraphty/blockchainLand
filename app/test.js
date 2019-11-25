const BlockChain = require('./blockchain');

// "node_1": "nodemon app.js 5000 http://localhost:5000",
//     "node_2": "nodemon app.js 5001 http://localhost:5001",
//     "node_3": "nodemon app.js 5002 http://localhost:5002",
//     "node_4": "nodemon app.js 5003 http://localhost:5003",

const block = new BlockChain();


 // "development": {
    //     "PORT": 8000,
    //     "MONGODB_URI": "mongodb://localhost:27017/blockchain",
    //     "JWT_SECRET": "pojiaj234oi234oij234oij4"
    // },

const blockData = {
    "chain": [
        {
            "index": 1,
            "timestamp": 1557959871569,
            "transactions": [],
            "nonce": 2000,
            "hash": "HHHHHHHHYYYY",
            "previousBlockHash": "IIIIIOOOOOOOO"
        },
        {
            "index": 2,
            "timestamp": 1557959924762,
            "transactions": [
                {
                    "amount": 7000,
                    "sender": "UUUUUUUUUUUUUYYYii",
                    "receipient": "TTTTTTTTTTTTUU00",
                    "trasactionId": "1bdf2520776211e99b5269b31a4d89a5"
                },
                {
                    "amount": 10000,
                    "sender": "UUUUUUUUUUUUUYYYii",
                    "receipient": "TTTTTTTTTTTTUU00",
                    "trasactionId": "20966ba0776211e99b5269b31a4d89a5"
                }
            ],
            "nonce": 49743,
            "hash": "01748bc360cf0e1cf5d0983ddf26edd32f0f902afe5377d7943c597d0684fcb2",
            "previousBlockHash": "HHHHHHHHYYYY"
        }
    ],
    "pendingTransactions": [],
    "currentNodeUrl": "http://localhost:5000",
    "networkNodes": []
}


console.log('Valid', block.chainIsValid(blockData.chain));