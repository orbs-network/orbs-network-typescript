import { types, KeyManager } from "../../src/common-library";
import { Gossip } from "../../src/gossip";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubObject, stubInterface } from "ts-sinon";
import { delay } from "bluebird";
import * as shell from "shelljs";

const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

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
        const keyManager = stubInterface<KeyManager>();
        const gossip = new Gossip({ localAddress: `node${i}`, port: 30070 + i, peers: { consensus }, keyManager, signMessages: false});
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

      await gossips[senderId].unicastMessage(gossips[recipientId].localAddress, "consensus", "TEST_MESSAGE", buffer, true);
      await delay(1000);

      for (let i = 0; i < numberOfGossips; i++) {
        const consensus = consensuses[i];
        if (i == recipientId) {
          expect(consensus.gossipMessageReceived).to.have.been.calledOnce;
          expect((<sinon.SinonSpy>consensus.gossipMessageReceived).getCall(0).args[0]).to.have.property("buffer").which.deep.equal(buffer);
        } else {
          expect(consensus.gossipMessageReceived).to.have.not.been.called;
        }
      }
    });

    it("#broadcast message triggers the service at all other nodes", async () => {
      const senderId = 0;
      const buffer = new Buffer(JSON.stringify({ foo: "bar" }));

      await gossips[senderId].broadcastMessage("consensus", "TEST_MESSAGE", buffer, true);
      await delay(2000);

      for (let i = 0; i < numberOfGossips - 1; i++) {
        const consensus = consensuses[i];
        if (i != senderId) {
          expect(consensus.gossipMessageReceived).to.have.been.calledOnce;
          expect((<sinon.SinonSpy>consensus.gossipMessageReceived).getCall(0).args[0]).to.have.property("buffer").which.deep.equal(buffer);
        } else {
          expect(consensus.gossipMessageReceived).to.have.not.been.called;
        }
      }
    });
  });

  describe("with signatures", () => {
    before(async function() {
      this.timeout(20000);

      shell.exec(`
        rm -rf ${__dirname}/test-private-keys
        mkdir -p ${__dirname}/test-private-keys

        rm -rf ${__dirname}/test-public-keys
        mkdir -p ${__dirname}/test-public-keys
      `);

      for (let i = 0; i < numberOfGossips; i++) {
        shell.exec(`
          ssh-keygen -t rsa -b 4096 -N "" -f ${__dirname}/test-private-keys/node${i}
          ssh-keygen -f ${__dirname}/test-private-keys/node${i}.pub -e -m pem > ${__dirname}/test-public-keys/node${i}
        `);
      }
    });

    beforeEach(async () => {
      consensuses = [];
      gossips = [];
      for (let i = 0; i < numberOfGossips; i++) {
        const consensus = stubObject<types.ConsensusClient>(<types.ConsensusClient>{}, ["gossipMessageReceived"]);
        const gossip = new Gossip({
          localAddress: `node${i}`, port: 30070 + i, peers: { consensus },
          signMessages: true,
          keyManager: new KeyManager({
            privateKeyPath: `${__dirname}/test-private-keys/node${i}`,
            publicKeysPath: `${__dirname}/test-public-keys/`
          })
        });
        consensuses.push(consensus);
        gossips.push(gossip);
      }
      await gossips[0].connect(gossips.map(gossip => `ws://127.0.0.1:${gossip.port}`));
      await delay(1000);
    });

    it("#unicast message signs message and triggers the service only at the recipient's node", async () => {
      const senderId = 0;
      const recipientId = 1;
      const buffer = new Buffer(JSON.stringify({ foo: "bar" }));

      await gossips[senderId].unicastMessage(gossips[recipientId].localAddress, "consensus", "TEST_MESSAGE", buffer, true);
      await delay(1000);

      for (let i = 0; i < numberOfGossips; i++) {
        const consensus = consensuses[i];
        if (i == recipientId) {
          expect(consensus.gossipMessageReceived).to.have.been.calledOnce;
          expect((<sinon.SinonSpy>consensus.gossipMessageReceived).getCall(0).args[0]).to.have.property("buffer").which.deep.equal(buffer);
        } else {
          expect(consensus.gossipMessageReceived).to.have.not.been.called;
        }
      }
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
          expect((<sinon.SinonSpy>consensus.gossipMessageReceived).getCall(0).args[0]).to.have.property("buffer").which.deep.equal(buffer);
        } else {
          expect(consensus.gossipMessageReceived).to.have.not.been.called;
        }
      }
    });

    xit("fails with wrong signature");
  });

  afterEach(async () => {
    for (const gossip of gossips) {
      await gossip.shutdown();
    }
  });
});
