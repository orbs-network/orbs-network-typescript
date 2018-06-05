import { OrbsClient, OrbsContract, Address, ED25519Key } from "orbs-client-sdk";
import * as crypto from "crypto";
import * as bluebird from "bluebird";
import * as redis from "redis";
import * as express from "express";
import * as _ from "lodash";

bluebird.promisifyAll(redis.RedisClient.prototype);

interface Config {
    endpoint: string;
    timeout: number;
}

const VIRTUAL_CHAIN_ID = "640ed3";

const {
    ORBS_API_ENDPOINT,
    TRANSACTION_TIMEOUT,
    NETWORK_ID,
    REDIS_URL
} = process.env;

const config = {
    endpoint: ORBS_API_ENDPOINT,
    timeout: Number(TRANSACTION_TIMEOUT) || 2000
};

let redisClient: any;

function getRedis() {
    if (!redisClient) {
        redisClient = redis.createClient(REDIS_URL);
        redisClient.on("error", console.error);
    }

    return redisClient;
}

function generateAddress(): [Address, ED25519Key] {
    const keyPair = new ED25519Key();
    const address = new Address(keyPair.publicKey, VIRTUAL_CHAIN_ID, NETWORK_ID || Address.TEST_NETWORK_ID);

    return [address, keyPair];
}

async function getContract(username: string, config: Config): Promise<OrbsContract> {
    const data = await loadAccount(username);

    let address: Address;
    let keyPair;

    if (data) {
        address = new Address(data.publicKey, VIRTUAL_CHAIN_ID, NETWORK_ID || Address.TEST_NETWORK_ID);
        keyPair = new ED25519Key(data.publicKey, data.privateKey);
    } else {
        [address, keyPair] = generateAddress();
        await saveAccount(username, keyPair);
    }

    const orbsClient = new OrbsClient(config.endpoint, address, keyPair, config.timeout);
    const contract = new OrbsContract(orbsClient, "event-counter");

    return Promise.resolve(contract);
}

async function saveAccount(username: any, keyPair: any) {
    return getRedis().hmsetAsync(username, { publicKey: keyPair.publicKey, privateKey: keyPair.getPrivateKeyUnsafe() }).timeout(config.timeout);
}

async function loadAccount(address: any) {
    return getRedis().hgetallAsync(address).timeout(config.timeout);
}

const app = express();
app.use(express.json());

async function executeTransaction(user_id: any, event_id: any, res: express.Response, callContract: (contract: OrbsContract, event_id: any) => any) {
    if (!user_id) {
        return res.status(400).json({ status: "NO_USER_ID" });
    }

    if (!event_id) {
        event_id = "default";
    }

    try {
        const contract = await getContract(user_id, config);
        const val = await callContract(contract, event_id);
        return res.json({ status: "OK", data: val });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ status: "INTERNAL_SERVER_ERROR" });
    }
}

app.post("/", async (req: express.Request, res: express.Response) => {
    return await executeTransaction(req.body.user_id, req.body.event_id, res, async (contract, event_id) => {
        return await contract.sendTransaction("reportEvent", [event_id.toString()]);
    });
});


app.get("/", async (req: express.Request, res: express.Response) => {
    if (_.isEmpty(req.query)) {
        try {
            await getRedis().pingAsync().timeout(config.timeout);
        } catch (e) {
            console.log(e);
            return res.status(503).json({ status: "TEMPORARY_UNAVAILABLE" });
        }

        return res.status(200).json({ status: "HEALTHY" });
    }

    return await executeTransaction(req.query.user_id, req.query.event_id, res, async (contract, event_id) => {
        return await contract.call("getCounter", [event_id.toString()]);
    });

});

app.listen(8080, () => console.log("Listening on port 8080"));
