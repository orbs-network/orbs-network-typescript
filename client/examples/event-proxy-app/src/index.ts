import { Account } from "./account";
import { OrbsClient, OrbsContract, Address, ED25519Key } from "orbs-client-sdk";
import * as crypto from "crypto";
import * as bluebird from "bluebird";
import * as redis from "redis";
import * as express from "express";
import * as bodyParser from "body-parser";

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

const redisClient: any = redis.createClient(REDIS_URL);

function generateAddress(): [Address, ED25519Key] {
  const keyPair = new ED25519Key();
  const address = new Address(keyPair.publicKey, VIRTUAL_CHAIN_ID, NETWORK_ID || Address.TEST_NETWORK_ID);

  return [address, keyPair];
}

async function getAccount(username: string, config: Config): Promise<Account> {
  const data = await loadAccount(username);

  let address: Address;
  let keyPair;

  if (data) {
    address = new Address(data.publicKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
    keyPair = new ED25519Key(data.publicKey, data.privateKey);
  } else {
    [address, keyPair] = generateAddress();
    await saveAccount(username, keyPair);
  }

  const orbsClient = new OrbsClient(ORBS_API_ENDPOINT, address, keyPair, config.timeout);
  const contract = new OrbsContract(orbsClient, "event-counter");
  const account = new Account(username, address.toString(), contract);

  return Promise.resolve(account);
}

async function saveAccount(username: any, keyPair: any) {
  return redisClient.hmsetAsync(username, { publicKey: keyPair.publicKey, privateKey: keyPair.getPrivateKeyUnsafe() });
}

async function loadAccount(address: any) {
  return redisClient.hgetallAsync(address);
}

const app = express();
// FIXME: check if we need body parser
app.use(bodyParser());

app.use("/", async (req: express.Request, res: express.Response) => {
  if (!req.body) {
    // FIXME: check redis ping just in case
    return res.status(200).json({ status: "HEALTHCHECK" });
  }

  const { user_id } = req.query;
  let { event_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ status: "NO_USER_ID" });
  }

  if (!event_id) {
    event_id = "default";
  }

  try {
    const account = await getAccount(user_id, config);
    const receipt = await account.reportEvent(event_id);

    return res.json({ status: "OK", receipt });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ status: "INTERNAL_SERVER_ERROR" });
  }
});

app.listen(8080, () => console.log("Listening on port 8080"));
