import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";

import { types } from "../../src/common-library/types";
import { BlockUtils } from "../../src/common-library";

const genesisBlock = BlockUtils.buildNextBlock({
  transactions: [],
  transactionReceipts: [],
  stateDiff: []
});


function generateEmptyBlock(lastBlock: types.Block): types.Block {
  return BlockUtils.buildNextBlock({
    transactions: [],
    transactionReceipts: [],
    stateDiff: []
  }, lastBlock);
}

function aValidTransaction(payload: string) {
  const transaction: types.Transaction = {
    header: {
      version: 0,
      sender: {id: new Buffer("sender"), scheme: 0, networkId: 0, checksum: 0},
      timestamp: Date.now().toString()
    },
    body: {
      contractAddress: {address: "address"},
      payload
    }
  };

  return transaction;
}

// describe("Block utils", () => {
//   describe("#calculateBlockHash", () => {
//     it("returns a hash", async () => {
//       const exampleBlock: types.Block = generateEmptyBlock(genesisBlock);
//       const hash = BlockUtils.calculateBlockHash(exampleBlock).toString("hex");

//       expect(hash).to.be.string;
//       expect(hash.length).to.be.eql(64);
//     });

//     it("returns same hash for blocks with same transactions", () => {
//       const tx1 = aValidTransaction("payload");
//       const tx2 = aValidTransaction("otherPayload");

//       const block1: types.Block = BlockUtils.buildNextBlock({
//         transactions: [ tx1, tx2 ],
//         transactionReceipts: [],
//         stateDiff: []
//       });

//       const block2: types.Block = BlockUtils.buildNextBlock({
//         transactionReceipts: [],
//         transactions: [ tx1, tx2 ],
//         stateDiff: []
//       });

//       expect(BlockUtils.calculateBlockHash(block1)).to.be.eql(BlockUtils.calculateBlockHash(block2));
//     });

//     it("does stuff", () => {
//       const exampleBlock: types.Block = {"header":{"version":0,"prevBlockHash":{"type":"Buffer","data":[140,9,128,97,45,43,92,229,79,204,248,65,113,105,215,199,45,168,25,99,232,60,108,223,183,110,69,106,217,108,48,187]},"height":5},"body":{"transactions":[{"header":{"version":0,"sender":{"scheme":0,"networkId":0,"id":{"type":"Buffer","data":[84,49,69,88,77,80,99,82,86,53,70,49,113,69,98,77,116,80,90,88,76,69,117,84,50,66,77,121,87,83,52,66,72,117,104,104,70,85,102]},"checksum":0},"timestamp":"1522922204361"},"body":{"contractAddress":{"address":"foobar"},"payload":"{\"method\":\"transfer\",\"args\":[\"T1EXMPWkjkg3o75TAKYL69AfjnGprWYcctzrw5d\",100]}"}}],"transactionReceipts":[{"txHash":{"type":"Buffer","data":[140,101,156,129,7,147,208,3,170,145,221,9,175,236,248,159,74,13,109,45,118,225,62,52,189,170,140,108,150,94,45,235]},"success":true}],"stateDiff":[{"contractAddress":{"address":"foobar"},"key":"balances.T1EXMPcRV5F1qEbMtPZXLEuT2BMyWS4BHuhhFUf","value":"9710"},{"contractAddress":{"address":"foobar"},"key":"balances.T1EXMPWkjkg3o75TAKYL69AfjnGprWYcctzrw5d","value":"290"}]}};

//       console.log(JSON.stringify(BlockUtils.calculateBlockHash(exampleBlock)));

//       console.log(JSON.stringify(BlockUtils.calculateBlockHash());
//     });
//   });
// });
