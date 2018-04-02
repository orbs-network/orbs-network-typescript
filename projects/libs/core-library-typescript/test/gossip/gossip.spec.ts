import { types } from "../../src/common-library";
import { Gossip } from "../../src/gossip";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubObject } from "ts-sinon";
import * as chaiBytes from "chai-bytes";
import { delay } from "bluebird";
import Signatures from "../../src/common-library/signatures";

const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(chaiBytes);

describe("Gossip", function () {
  this.timeout(20000);
  let consensuses: types.ConsensusClient[];
  let gossips: Gossip[];
  const numberOfGossips = 3;

  describe("without signatures", () => {
    beforeEach(async () => {
      consensuses = [];
      gossips = [];
      for (let i = 0; i < numberOfGossips; i++) {
        const consensus = stubObject<types.ConsensusClient>(<types.ConsensusClient>{}, ["gossipMessageReceived"]);
        const gossip = new Gossip({ localAddress: `node${i}`, port: 30070 + i, peers: { consensus } });
        consensuses.push(consensus);
        gossips.push(gossip);
      }
      await gossips[0].connect(gossips.map(gossip => `ws://127.0.0.1:${gossip.port}`));
      await delay(1000);
    });

    it("#unicast message triggers the service only at the recipient's node", async () => {
      const senderId = 0;
      const recipientId = 1;
      const buffer = new Buffer(JSON.stringify({ foo: "bar" }));
      console.log("XX", buffer.toString());

      await gossips[senderId].unicastMessage(gossips[recipientId].localAddress, "consensus", "TEST_MESSAGE", buffer, true);
      await delay(1000);

      for (let i = 0; i < numberOfGossips; i++) {
        const consensus = consensuses[i];
        if (i == recipientId) {
          expect(consensus.gossipMessageReceived).to.have.been.calledOnce;
          expect(consensus.gossipMessageReceived.getCall(0).args[0]).to.have.property("buffer").which.equalBytes(buffer);
        } else {
          expect(consensus.gossipMessageReceived).to.have.not.been.called;
        }
      }
    });

    it.only("#broadcast message triggers the service at all other nodes", async () => {
      const senderId = 0;
      const buffer = new Buffer(JSON.stringify({ foo: "bar" }));

      await gossips[senderId].broadcastMessage("consensus", "TEST_MESSAGE", buffer, true);
      await delay(2000);

      for (let i = 0; i < numberOfGossips - 1; i++) {
        const consensus = consensuses[i];
        if (i != senderId) {
          expect(consensus.gossipMessageReceived).to.have.been.calledOnce;
          expect(consensus.gossipMessageReceived.getCall(0).args[0]).to.have.property("buffer").which.equalBytes(buffer);
        } else {
          expect(consensus.gossipMessageReceived).to.have.not.been.called;
        }
      }
    });
  });

  describe("with signatures", () => {
    beforeEach(async () => {
      consensuses = [];
      gossips = [];
      for (let i = 0; i < numberOfGossips; i++) {
        const consensus = stubObject<types.ConsensusClient>(<types.ConsensusClient>{}, ["gossipMessageReceived"]);
        const gossip = new Gossip({
          localAddress: `node${i}`, port: 30070 + i, peers: { consensus },
          signMessages: true,
          signatures: new Signatures({
            message: {
              privateKeyPath: `${__dirname}/test-private-keys/node${i}`,
              publicKeysPath: `${__dirname}/test-public-keys/`
            }
          })
        });
        consensuses.push(consensus);
        gossips.push(gossip);
      }
      await gossips[0].connect(gossips.map(gossip => `ws://127.0.0.1:${gossip.port}`));
      await delay(1000);
    });


    it("#broadcast signs messages", async () => {
      const senderId = 0;
      const buffer = new Buffer(JSON.stringify({ foo: "bar" }));

      await gossips[senderId].broadcastMessage("consensus", "TEST_MESSAGE", buffer, true);
      await delay(2000);

      for (let i = 0; i < numberOfGossips - 1; i++) {
        const consensus = consensuses[i];
        if (i != senderId) {
          expect(consensus.gossipMessageReceived).to.have.been.calledOnce;
          // expect(consensus.gossipMessageReceived.getCall(0).args[0]).to.have.property("buffer").which.equalBytes(buffer);
        } else {
          expect(consensus.gossipMessageReceived).to.have.not.been.called;
        }
      }
    });

    xit("verifies signatures");
  });

  afterEach(async () => {
    for (const gossip of gossips) {
      await gossip.shutdown();
    }
  });
});
