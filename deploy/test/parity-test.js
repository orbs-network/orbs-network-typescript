/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://ethereum.services.orbs-test.com:8545"));

Promise.all([web3.eth.isSyncing(), web3.eth.net.getPeerCount()]).then(([syncStatus, peerCount]) => {
    const isSyncing = syncStatus.currentBlock !== syncStatus.highestBlock;
    console.log(`Node ${isSyncing ? "is" : "is not"} syncing and has ${peerCount} peers`);
}).catch(console.error);