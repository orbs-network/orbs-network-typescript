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


const consensus1 = stubObject<types.ConsensusClient>(<types.ConsensusClient>{}, ["gossipMessageReceived"]);
const consensus2 = stubObject<types.ConsensusClient>(<types.ConsensusClient>{}, ["gossipMessageReceived"]);


describe("Gossip", function() {
    this.timeout(20000);
    let gossip1, gossip2: Gossip;

    before(async() => {
        gossip1 = new Gossip({localAddress: "node1", port: 30028, peers: { consensus: consensus1 }, gossipPeers: [] });
        gossip2 = new Gossip({localAddress: "node2", port: 30029, peers: { consensus: consensus2 }, gossipPeers: [] });
        await gossip1.connect([`ws://127.0.0.1:${gossip2.port}`]);
        await delay(1000);
    });

    it("unicast message from one gossip to another", async () => {
        const buffer = new Buffer(JSON.stringify({foo: "bar"}));
        await gossip1.unicastMessage(gossip2.localAddress, "consensus", "TEST_MESSAGE", buffer, true);
        await delay(1000);
        consensus2.gossipMessageReceived.should.have.been.calledOnce;
        consensus2.gossipMessageReceived.getCall(0).args[0].should.have.property("Buffer").which.equalBytes(buffer);
    });
});
