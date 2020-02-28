const express = require('express');
const mongoose = require('mongoose');
const uuid = require('uuid/v1');
const route = express.Router();
const blockChain = require(`${APP_ROOT_PATH}blockchain`);
const rp = require('request-promise');
const path = require('path');
const passwordHelper = require('../helpers/passwordHelper');
const jwtHelper = require('../helpers/jwtHelper');
const PendingLandModel = require('../models/PendingLand');
const LandModel = require('../models/Land');
const UserModel = require('../models/User');
const BlockModel = require('../models/Block');
const NetworkModel = require('../models/NetworkNode');

const blockNetwork = new blockChain();

route.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

route.post('/user/broadcast', async (req, res) => {
    try {

        let hash = passwordHelper.hash(req.body.pass);

        const userCount = await UserModel.countDocuments({ username: req.body.user });

        if (userCount === 0) {

            let body = {
                _id: mongoose.Types.ObjectId(),
                username: req.body.user,
                password: hash
            };

            // push to blocknetwork users
            blockNetwork.user = body;

            // create user in current db
            await UserModel.create(body);

            let regNodePromises = [];

            blockNetwork.networkNodes.forEach(networkNodeUrl => {
                // console.log('Network nodes----', networkNodeUrl);
                let requestOptions = {
                    uri: `${networkNodeUrl.node_url}/user`,
                    method: 'POST',
                    body: {
                        user: blockNetwork.user
                    },
                    json: true
                }

                regNodePromises.push(rp(requestOptions));

            });

            Promise.all(regNodePromises)
                .then(data => {
                    res.send('User created successful');
                })
                .catch(e => {
                    console.log('Error', e);
                })
        }

    } catch (e) {
        console.log('E', e.message);
    }
});

route.get('/user', async (req, res) => {
    let user = await UserModel.find();

    res.status(200).json({
        message: 'Successful User',
        user
    });
});

route.post('/user', async (req, res) => {
    try {
        let user = req.body.user;

        const newtworkCount = await UserModel.countDocuments({ username: user.username });
        const notAlreadyPresent = newtworkCount === 0;

        if (notAlreadyPresent) {
            UserModel.create(user)
                .then(data => {
                    res.status(200).send('User created successfully');
                })
                .catch(e => {
                    res.status(500).send('Could not create user');
                });
        } else {
            res.status(403).send('User already exist');
        }

    } catch (e) {
        console.log('Error', e);
    }
});

route.post('/user/login', async (req, res) => {
    try {
        let body = req.body;

        // console.log('Body----', body);

        let hash = passwordHelper.hash(body.pass);

        // console.log('Hash----', hash);

        const userCount = await UserModel.countDocuments({ username: body.user  });

        // console.log('UserCount----', userCount);

        if (userCount === 1) {
            let user = await UserModel.findOne({ username: body.user  });

            // console.log('Userr ===', user);

            user = JSON.stringify(user);
            user = JSON.parse(user);

            let token = jwtHelper.sign(user);
            user.token = token;

            delete user.password;

            res.status(200).json({
                message: 'Successful Login',
                user
            });

        } else {
            res.status(403).send('User does not exists');
        }

    } catch (e) {
        console.log('Error', e);
    }
});

route.post('/smart/contract', async (req, res) => {
    let landId = req.body.landId;
    let userId = req.body.userId;
    let receipientId = req.body.receipientId;

    await LandModel.updateOne({ landId, userId }, { $set: { userId: receipientId } });

    let newLand = await LandModel.findOne({ landId });

    // console.log('New Land', newLand);

    let newTransaction = blockNetwork.createNewTransaction(newLand, 'old');

    blockNetwork.addTransactionToPendingTransactionsOnly(newTransaction);

    res.status(200).send('Transferred land successfully');

});

route.get('/user/lands/:userId', async (req, res) => {
    let userId = req.params.userId;
    let lands = await LandModel.find({ userId: userId }).populate('userId');

    res.json(lands);
});

route.get('/blockchain', (req, res) => {
    res.send(blockNetwork);
});

route.post('/transaction', (req, res) => {
    const newTransaction = req.body;
    const blockIndex = blockNetwork.addTransactionToPendingTransactions(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}` });
});

// Mine all pending transactions i.e Convert all pending transactions to a hash
route.get('/mine', (req, res) => {

    blockNetwork.getLastBlockForApi(async (lastBlock) => {
        const previousBlockHash = lastBlock['hash'];
        // console.log('Prev Block', lastBlock);

        let pendingLand = await PendingLandModel.find({});

        const currentBlockData = {
            index: lastBlock['index'] + 1,
            transactions: pendingLand
        };

        const nonce = blockNetwork.proofOfWork(previousBlockHash, currentBlockData);

        const blockHash = blockNetwork.hashBlock(previousBlockHash, currentBlockData, nonce);

        const newBlock = await blockNetwork.createNewBlock(nonce, previousBlockHash, blockHash);

        // console.log('New Block', newBlock);

        let regNodePromises = [];

        blockNetwork.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: `${networkNodeUrl.node_url}/receive-new-block`,
                method: 'POST',
                body: newBlock,
                json: true
            }

            regNodePromises.push(rp(requestOptions));
        });

        Promise.all(regNodePromises)
            .then(data => {
                res.json({
                    note: 'block mined and broadcast successfully',
                    block: newBlock
                });
            });
    });
});

route.post('/register-trans-in-db', (req, res) => {

    // console.log(' Body ', req.body.userId);
    // blockNetwork.insertNetworkNodeInDb(req.body.node_url);
    let newTransaction = blockNetwork.createNewTransaction(req.body);

    blockNetwork.addTransactionToPendingTransactions(newTransaction);

    res.json({
        note: 'New transaction inserted successfully',
    });

});

route.post('/receive-new-block', async (req, res) => {
    const newBlock = req.body;

    const lastBlock = await blockNetwork.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = parseInt(lastBlock.blockIndex + 1) === parseInt(newBlock.blockIndex);

    // console.log(correctHash, correctIndex, lastBlock.hash, lastBlock.blockIndex, newBlock.blockIndex);

    if (correctHash && correctIndex) {
        // blockNetwork.chain.push(newBlock);
        // blockNetwork.pendingTransactions = [];

        // console.log('New Block Correct ---------', newBlock);

        await BlockModel.create(newBlock);
        await PendingLandModel.deleteMany({});

        res.json({
            note: 'New block received and accepeted',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New block rejected',
            newBlock: newBlock
        });
    }

});

// register and broadcast node to the network
route.post('/register-and-broadcast-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;

    console.log('Body', newNodeUrl);
    // const notCurrentNode = newNodeUrl !== blockNetwork.currentNodeUrl;

    const checkNode = blockNetwork.networkNodes.filter(nd => {
        return nd.node_url === newNodeUrl;
    });

    if (checkNode.length === 0) {
        // console.log('Not found', checkNode);
        blockNetwork.networkNodes.push({ node_url: newNodeUrl });
    }

    blockNetwork.networkNodes.push({ node_url: blockNetwork.currentNodeUrl });

    let regNodePromises = [];

    blockNetwork.networkNodes.forEach(networkNodeUrl => {
        // console.log('Network nodes----', networkNodeUrl);
        let requestOptions = {
            uri: `${networkNodeUrl.node_url}/register-node`,
            method: 'POST',
            body: {
                newNodeUrl: newNodeUrl
            },
            json: true
        }

        regNodePromises.push(rp(requestOptions));

    });

    // console.log('Reg Node promises count', regNodePromises.length);

    Promise.all(regNodePromises)
        .then(data => {
            const bulkRequestOptions = {
                uri: `${newNodeUrl}/register-nodes-bulk`,
                method: 'POST',
                body: {
                    allNetworkNodes: [...blockNetwork.networkNodes, { node_url: blockNetwork.currentNodeUrl }]
                },
                json: true
            }

            return rp(bulkRequestOptions)
        })
        .then(data => {
            res.send({ note: 'New Node registered with network successfully' });
        })
        .catch(e => {
            console.log('Error', e);
        })
});


route.post('/register-node-in-db', (req, res) => {
    blockNetwork.insertNetworkNodeInDb(req.body.node_url);
    res.json({
        note: 'New node inserted successfully',
    });
});

// register a node with the network
route.post('/register-node', async (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    // console.log('Icoming Data', newNodeUrl);
    // const notAlreadyPresent = blockNetwork.networkNodes.indexOf(newNodeUrl) === -1;
    const newtworkCount = await NetworkModel.countDocuments({ node_url: newNodeUrl });
    const notAlreadyPresent = newtworkCount == 0;

    const notCurrentNode = blockNetwork.currentNodeUrl !== newNodeUrl;

    if (notAlreadyPresent && notCurrentNode) {
        // console.log('Before Insert-----------')
        blockNetwork.insertNetworkNodeInDb(req.body.newNodeUrl);
    } else {
        console.log('Error', blockNetwork.currentNodeUrl, notAlreadyPresent, newtworkCount, notCurrentNode);
    }

    res.json({ note: 'New node registered successfully with node.' });
});

// register a node with the network
route.post('/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    // console.log('all nodes--------', allNetworkNodes);
    allNetworkNodes.forEach(async networkNodeUrl => {
        // console.log('NetworkNode---', networkNodeUrl);
        const nodeCount = await NetworkModel.countDocuments({ node_url: networkNodeUrl.node_url });

        const notAlreadyPresent = nodeCount === 0;

        const notCurrentNode = blockNetwork.currentNodeUrl !== networkNodeUrl;
        //if (notAlreadyPresent && notCurrentNode) blockNetwork.networkNodes.push(networkNodeUrl);
        if (notAlreadyPresent && notCurrentNode) {
            blockNetwork.insertNetworkNodeInDb(networkNodeUrl.node_url);
        }

    });

    res.json({ note: 'Bulk registration successful.' });
});

// Post a transaction and broadcast to other networks
route.post('/transaction/broadcast', (req, res) => {

    const newTransaction = blockNetwork.createNewTransaction(req.body);

    blockNetwork.addTransactionToPendingTransactions(newTransaction);

    let regNodePromises = [];

    blockNetwork.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: `${networkNodeUrl.node_url}/transaction`,
            method: 'POST',
            body: newTransaction,
            json: true
        }

        regNodePromises.push(rp(requestOptions));
    });

    Promise.all(regNodePromises)
        .then(data => {
            res.json({ note: 'Transaction Created and broadcast successfully' });
        });
});

route.get('/consesus', (req, res) => {

    let regNodePromises = [];

    blockNetwork.networkNodes.forEach(networkNodeUrl => {

        const requestOptions = {
            uri: `${networkNodeUrl}/blockchain`,
            method: 'GET',
            json: true
        }

        regNodePromises.push(rp(requestOptions));

    });

    Promise.all(regNodePromises)
        .then(async  blockchains => {
            const currentChainLength = await BlockModel.countDocuments();
            // const currentChainLength = blockNetwork.chain.length;
            let maxChainLength = currentChainLength;
            let newLongestChain = null;
            let newPendingTransactions = null;

            blockchains.forEach(blockchain => {
                if (blockchain.chain.length > maxChainLength) {
                    maxChainLength = blockchain.chain.length;
                    newLongestChain = blockchain.chain;
                    newPendingTransactions = blockchain.pendingTransactions;
                }
            });

            if (!newLongestChain || (newLongestChain && !blockNetwork.chainIsValid(newLongestChain))) {
                res.json({
                    note: 'Current chain as not been replaced',
                    chain: blockNetwork.chain
                });
            } else if (newLongestChain && blockNetwork.chainIsValid(newLongestChain)) {

                blockNetwork.chain = newLongestChain;
                blockNetwork.pendingTransactions = newPendingTransactions;

                res.json({
                    note: 'This chain has been replaced',
                    chain: blockNetwork.chain
                });
            }
        });
});

route.get('/block/:blockHash', (req, res) => {
    const blockHash = req.params.blockHash;
    const correctBlock = blockNetwork.getBlock(blockHash);

    res.json({
        block: correctBlock
    });

});

route.get('/transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;
    blockNetwork.getTransaction(transactionId)
        .then(transactionData => {
            // console.log('Transaction data', transactionData);

            res.json({
                transaction: transactionData.transaction[0].transactions,
                block: transactionData
            });
        });
});

route.get('/address/:address', (req, res) => {
    const address = req.params.address;

    const addressData = blockNetwork.getAddressData(address);

    res.json({
        addressData
    });
});

module.exports = route;