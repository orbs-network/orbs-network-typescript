import { FooBarAccount } from "./foobar-account";
import { RTMClient } from "@slack/client";
import { OrbsClient, OrbsContract, Address } from "orbs-client-sdk";
import * as crypto from "crypto";

interface Config {
  endpoint: string;
  timeout: number;
}

const {
  SLACK_VERIFICATION_TOKEN,
  SLACK_TOKEN,
  CONVERSATION_ID,
  ORBS_API_ENDPOINT,
  TRANSACTION_TIMEOUT
} = process.env;

const PULL_REQUEST_AWARD = 100;

const config = {
  endpoint: ORBS_API_ENDPOINT,
  timeout: Number(TRANSACTION_TIMEOUT) || 2000
};


function generateAddress(username: string): string {
  const virtualChainId = "640ed3";
  const publicKey = crypto.createHash("sha256").update(username).digest("hex");
  const address = new Address(publicKey, virtualChainId, Address.TEST_NETWORK_ID);

  return address.toString();
}


async function getAccount(username: string, config: Config): Promise<FooBarAccount> {
  const address = generateAddress(username);
  const orbsClient = new OrbsClient(address, undefined, config.timeout);
  const contract = new OrbsContract(orbsClient, "foobar");
  const account = new FooBarAccount(username, address, contract);

  return Promise.resolve(account);
}

async function matchInput(message: any, condition: RegExp, botUsername: string,
  callback: (clientAccount: FooBarAccount, botAccount: FooBarAccount, match: any) => void) {
    const matches = message.text.match(condition);

    if (matches) {
      const [clientAccount, botAccount] = await Promise.all([
        getAccount(message.user, config), getAccount(botUsername, config)
      ]);

      callback(clientAccount, botAccount, matches);
    }
}

function mention(client: FooBarAccount) {
  return `<@${client.username}> ${client.address}`;
}

const rtm = new RTMClient(SLACK_TOKEN, { autoReconnect: true, useRtmConnect: true });
rtm.start({});

rtm.on("message", async (message) => {
  const BOT_USER_ID = rtm.activeUserId;
  console.log(`Connected as bot with id ${BOT_USER_ID}`);

  // For structure of `event`, see https://api.slack.com/events/message

  // Skip messages that are from a bot or my own user ID
  if ((message.subtype && message.subtype === "bot_message") ||
    (!message.subtype && message.user === rtm.activeUserId)) {
    return;
  }

  console.log(JSON.stringify(message));

  // Log the message
  console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`);

  try {
    matchInput(message, /^get my address$/i, BOT_USER_ID, async (client, bot, match) => {
      const clientBalance = await client.getMyBalance();
      rtm.sendMessage(mention(client), message.channel);
    });

    matchInput(message, /^get my balance$/i, BOT_USER_ID, async (client, bot, match) => {
      const clientBalance = await client.getMyBalance();
      rtm.sendMessage(`${mention(client)} has ${clientBalance} magic internet money`, message.channel);
    });

    matchInput(message, /^get bot balance$/i, BOT_USER_ID, async (client, bot, match) => {
      const botBalance = await bot.getMyBalance();
      rtm.sendMessage(`${mention(bot)} now has ${botBalance} magic internet money`, message.channel);
    });

    matchInput(message, /^good bot gets (\d+)$/i, BOT_USER_ID, async (client, bot, match) => {
      const amount = Number(match[1]);
      rtm.sendMessage(`Set ${mention(bot)} balance to ${amount} magic internet money`, message.channel);

      await bot.initBalance(bot.address, amount);

      const balance = await bot.getMyBalance();
      rtm.sendMessage(`${mention(bot)} now has ${balance} magic internet money`, message.channel);
    });

    matchInput(message, /I opened a pull request/i, BOT_USER_ID, async (client, bot, match) => {
      rtm.sendMessage(`Transfering ${PULL_REQUEST_AWARD} to ${mention(client)}`, message.channel);
      await bot.transfer(client.address, PULL_REQUEST_AWARD);

      const [ clientBalance, botBalance ] = await Promise.all([client.getMyBalance(), bot.getMyBalance()]);
      rtm.sendMessage(`${mention(client)} has ${clientBalance} magic internet money`, message.channel);
      rtm.sendMessage(`${mention(bot)} now has ${botBalance} magic internet money`, message.channel);
    });

    matchInput(message, /[transfer|send] (\d+) to <@(\w+)>/, BOT_USER_ID, async (client, bot, match) => {
      const amount = Number(match[1]);
      const to = match[2];

      const receiver = await getAccount(to, config);
      rtm.sendMessage(`Transfering ${amount} from ${mention(client)} to ${mention(receiver)}`, message.channel);

      await client.transfer(receiver.address, amount);

      const [ clientBalance, receiverBalance ] = await Promise.all([client.getMyBalance(), receiver.getMyBalance()]);
      rtm.sendMessage(`${mention(client)} now has ${clientBalance} magic internet money`, message.channel);
      rtm.sendMessage(`${mention(receiver)} now has ${receiverBalance} magic internet money`, message.channel);
    });
  } catch (e) {
    console.log(`Error occurred: ${e}`);
  }

});
