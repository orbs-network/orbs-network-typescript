const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://ethereum.services.orbs-test.com:8545"));

Promise.all([web3.eth.isSyncing(), web3.eth.net.getPeerCount()]).then(([syncStatus, peerCount]) => {
    const isSyncing = syncStatus.currentBlock !== syncStatus.highestBlock;
    console.log(`Node ${isSyncing ? "is" : "is not"} syncing and has ${peerCount} peers`);
}).catch(console.error);