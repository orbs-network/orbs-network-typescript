import { types } from "../../src/common-library";
import { Gossip } from "../../src/gossip";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubObject } from "ts-sinon";
import * as chaiBytes from "chai-bytes";
import { delay } from "bluebird";

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(chaiBytes);


describe("Gossip", function() {
    this.timeout(20000);
    let consensuses: types.ConsensusClient[];
    let gossips: Gossip[];
    const numberOfGossips = 3;

    beforeEach(async() => {
        consensuses = [];
        gossips = [];
        for (let i = 0; i < numberOfGossips; i++) {
            const consensus = stubObject<types.ConsensusClient>(<types.ConsensusClient>{}, ["gossipMessageReceived"]);
            const gossip = new Gossip({localAddress: `node${i}`, port: 30070 + i, peers: { consensus }});
            consensuses.push(consensus);
            gossips.push(gossip);
        }
        await gossips[0].connect(gossips.map(gossip => `ws://127.0.0.1:${gossip.port}`));
        await delay(1000);
    });

    it("#unicast message triggers the service only at the recipient's node", async () => {
        const senderId = 0;
        const recipientId = 1;
        const buffer = new Buffer(JSON.stringify({foo: "bar"}));

        await gossips[senderId].unicastMessage(gossips[recipientId].localAddress, "consensus", "TEST_MESSAGE", buffer, true);
        await delay(1000);

        for (let i = 0; i < numberOfGossips; i++) {
            const consensus = consensuses[i];
            if (i == recipientId) {
                consensus.gossipMessageReceived.should.have.been.calledOnce;
                consensus.gossipMessageReceived.getCall(0).args[0].should.have.property("Buffer").which.equalBytes(buffer);
            } else {
                consensus.gossipMessageReceived.should.have.not.been.called;
            }
        }
    });

    it("#broadcast message triggers the service at all other nodes", async () => {
        const senderId = 0;
        const buffer = new Buffer(JSON.stringify({foo: "bar"}));

        await gossips[senderId].broadcastMessage("consensus", "TEST_MESSAGE", buffer, true);
        await delay(2000);

        for (let i = 0; i < numberOfGossips - 1; i++) {
            const consensus = consensuses[i];
            if (i != senderId) {
                consensus.gossipMessageReceived.should.have.been.calledOnce;
                consensus.gossipMessageReceived.getCall(0).args[0].should.have.property("Buffer").which.equalBytes(buffer);
            } else {
                consensus.gossipMessageReceived.should.have.not.been.called;
            }
        }
    });

    afterEach(() => {
        for (const gossip of gossips) {
            gossip.server.close();
        }
    });

});
