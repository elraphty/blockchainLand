const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');
const BlockModel = require('./models/Block');
const LandModel = require('./models/Land');
const PendingLandModel = require('./models/PendingLand');
const NetworkModel = require('./models/NetworkNode');

/** Blockchain base function */
function BlockChain() {  
     
    // current block chain
    BlockModel.find().then(res => {
        // console.log(res);
        this.chain = res;
    });
    // network pending transactions
    PendingLandModel.find().then(res => {
        this.pendingTransactions = res;
    });
    // current network url
    this.currentNodeUrl = currentNodeUrl;
    // network nodes
    NetworkModel.find().then(res => {
        this.networkNodes = res;
        // console.log('Network Nodes ===', res);
    });

    this.user = null;

    BlockModel.countDocuments()
        .then(count => {
            // console.log('Block Count', count);
            if (count === 0) {
                this.createNewBlock(2000, 'IIIIIOOOOOOOO', 'HHHHHHHHYYYY');
            }
        })
}

BlockChain.prototype.createNewBlock = async function (nonce, previousBlockHash, hash) {
    // get block count
    let blockCount = await BlockModel.countDocuments();
    let pendingLand = await PendingLandModel.find({});

    const newBlock = {
        blockIndex: blockCount + 1,
        blockTime: Date.now(),
        transactions: pendingLand,
        nonce,
        hash,
        previousBlockHash
    };

    // this.pendingTransactions = [];

    await PendingLandModel.deleteMany({});

    // this.chain.push(newBlock);
    // check if the model is empty if empty insert in the db
    await BlockModel.create(newBlock);

    return newBlock;
}


BlockChain.prototype.insertNetworkNodeInDb = async function (node) {
    if (node !== this.currentNodeUrl) {
        await NetworkModel.create({
            node_url: node
        });
    } else {
        console.log('It is dsame', node);
    }
}

BlockChain.prototype.getLastBlock = async function () {
    let blockCount = await BlockModel.countDocuments({});
    let lastBlock = await BlockModel.findOne({ blockIndex: blockCount });
    return lastBlock;
}

BlockChain.prototype.getLastBlockForApi = async function (callback) {
    let blockCount = await BlockModel.countDocuments({});
    let lastBlock = await BlockModel.findOne({ blockIndex: blockCount });
    return callback(lastBlock);

}

BlockChain.prototype.createNewTransaction = function (data, type = 'new') {

    let newTransaction;

    if (type === 'old') {
        newTransaction = {
            familyName: data.familyName,
            address: data.address,
            size: data.size,
            coordinates: data.coordinates,
            landId: data.landId,
            userId: data.userId
        };
    } else  {
        newTransaction = {
            familyName: data.familyName,
            address: data.address,
            size: data.size,
            coordinates: data.coordinates,
            landId: uuid().split('-').join(''),
            userId: data.userId
        };
    }

    

    // this.pendingTransactions.push(newTransaction);

    // return this.getLastBlock()['index'] + 1;

    return newTransaction;
}

BlockChain.prototype.addTransactionToPendingTransactionsOnly = async function (transactionObj) {

    // console.log('Object', transactionObj);

    await PendingLandModel.create(transactionObj);

    return true;
}

BlockChain.prototype.addTransactionToPendingTransactions = async function (transactionObj) {

    // console.log('Object', transactionObj);

    await PendingLandModel.create(transactionObj);
    await LandModel.create(transactionObj);

    return this.getLastBlock()['blockIndex'] + 1;
}

BlockChain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    // console.log('hash', hash);

    return hash;
}

/**
 * => Repeatedly hash block of data till it finds correct hash
 * => Uses current block data for the hash and also previous hash
 * => continously changes nonce value until it finds the correct hash
 * => returns to us the correct nonce value that creates the correct hash
 */

BlockChain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while (hash.substring(0, 2) !== process.env.SECRET_CODE) {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        console.log('hash', hash, hash.substring(0, 2), process.env.SECRET_CODE);
    }

    return nonce;
}

BlockChain.prototype.chainIsValid = function (blockchain) {

    let validChain = true;

    for (let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];

        const blockHash = this.hashBlock(prevBlock['hash'],
            {
                index: currentBlock['index'],
                transactions: currentBlock['transactions'],
            },

            currentBlock['nonce']
        );

        // console.log('current Block', currentBlock);

        if (blockHash.substring(0, 4) !== process.env.SECRET_CODE) validChain = false;
        if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false; // chain not valid

    }

    const genesisBlock = blockchain[0];

    const correctNonce = genesisBlock['nonce'] === 2000;
    const correctPreviousHash = genesisBlock['previousBlockHash'] === 'IIIIIOOOOOOOO';
    const correctHash = genesisBlock['hash'] === 'HHHHHHHHYYYY';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (!correctNonce || !correctPreviousHash || !correctHash || !correctTransactions) {
        console.log('Lastcheck incorect');
        validChain = false;
    }

    return validChain;
}

BlockChain.prototype.getBlock = async function (blockHash) {
    // let correctBlock = null;
    // this.chain.find((block, i) => {
    //     if (block.hash === blockHash) correctBlock = block;
    // });

    let correctBlock = await BlockModel.findOne({ 'hash': blockHash });

    return correctBlock;
}

BlockChain.prototype.getTransaction = async function (landId) {

    let correctTransaction = null;
    let correctBlock = null;

    // let transactions = BlockModel.find('transactions');

    // console.log('Transactionid', transactionId);

    // transactions.forEach((block) => {
    //     // console.log('block', block);
    //     transactions.find(transaction => {
    //         console.log('Transaction', transaction);
    //         if (transaction.landId === landId) {
    //             correctTransaction = transaction;
    //             correctBlock = block;
    //         }
    //     });
    // });

    let transaction = await BlockModel.find({ 'transactions.landId': landId });
    // console.log('Transaction', transaction);

    // return {
    //     transaction,
    //     block: correctBlock
    // };

    return {
        transaction
    }
}

BlockChain.prototype.getAddressData = function (address) {
    const addressTransactions = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.sender === address || transaction.receipient === address) {
                addressTransactions.push(transaction)
            }
        });
    });

    let balance = 0;
    addressTransactions.forEach(transaction => {
        if (transaction.receipient === address) balance += transaction.amount;
        else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
        addressTransactions,
        balance
    }
}

module.exports = BlockChain;