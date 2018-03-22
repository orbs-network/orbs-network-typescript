import { PublicApiClient } from "orbs-interfaces";
import { initPublicApiClient } from "./public-api-client";
import { OrbsClientSession, OrbsHardCodedContractAdapter } from "./orbs-client";
import { FooBarAccount } from "./foobar-account";
import { RTMClient } from "@slack/client";

interface Config {
  subscriptionKey: string;
  publicApiClient: PublicApiClient;
  timeout: number;
}

const {
  SLACK_VERIFICATION_TOKEN,
  SLACK_TOKEN,
  CONVERSATION_ID,
  ORBS_API_ENDPOINT,
  TRANSACTION_TIMEOUT
} = process.env;

const BOT_ADDRESS = "0000";
const PULL_REQUEST_AWARD = 100;

const config = {
  subscriptionKey: "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebe",
  publicApiClient: initPublicApiClient({
    endpoint: ORBS_API_ENDPOINT
  }),
  timeout: Number(TRANSACTION_TIMEOUT) || 2000
};

async function getAccount(senderAddress: string, config: Config): Promise<FooBarAccount> {
  const orbsSession = new OrbsClientSession(senderAddress, config.subscriptionKey, config.publicApiClient, config.timeout);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
  const account = new FooBarAccount(senderAddress, contractAdapter);

  return Promise.resolve(account);
}

async function getBotAccount(config: Config) {
  const botAccount = await getAccount(BOT_ADDRESS, config);
  return botAccount;
}

async function matchInput(message: any, condition: RegExp,
  callback: (clientAccount: FooBarAccount, botAccount: FooBarAccount, match: any) => void) {
    const matches = message.text.match(condition);

    if (matches) {
      const [clientAccount, botAccount] = await Promise.all([
        getAccount(message.user, config), getBotAccount(config)
      ]);

      callback(clientAccount, botAccount, matches);
    }
}

function mention(user: string) {
  return `<@${user}>`;
}

const rtm = new RTMClient(SLACK_TOKEN, { autoReconnect: true, useRtmConnect: true });
rtm.start({});

rtm.on("message", async (message) => {
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
    matchInput(message, /^get my balance$/i, async (client, bot, match) => {
      const clientBalance = await client.getMyBalance();
      rtm.sendMessage(`${mention(client.address)} has ${clientBalance} magic internet money`, message.channel);
    });

    matchInput(message, /^get bot balance$/i, async (client, bot, match) => {
      const botBalance = await bot.getMyBalance();
      rtm.sendMessage(`Bot now has ${botBalance} magic internet money`, message.channel);
    });

    matchInput(message, /^good bot gets (\d+)$/i, async (client, bot, match) => {
      const amount = Number(match[1]);
      rtm.sendMessage(`Set bot balance to ${amount} magic internet money`, message.channel);

      await bot.initBalance(BOT_ADDRESS, amount);

      const balance = await bot.getMyBalance();
      rtm.sendMessage(`Bot now has ${balance} magic internet money`, message.channel);
    });

    matchInput(message, /I opened a pull request/i, async (client, bot, match) => {
      rtm.sendMessage(`Transfering ${PULL_REQUEST_AWARD} to ${mention(message.user)}`, message.channel);
      await bot.transfer(client.address, PULL_REQUEST_AWARD);

      const [ clientBalance, botBalance ] = await Promise.all([client.getMyBalance(), bot.getMyBalance()]);
      rtm.sendMessage(`${mention(client.address)} has ${clientBalance} magic internet money`, message.channel);
      rtm.sendMessage(`Bot now has ${botBalance} magic internet money`, message.channel);
    });

    matchInput(message, /transfer (\d+) to <@(\w+)>/, async (client, bot, match) => {
      const amount = Number(match[1]);
      const to = match[2];

      const receiver = await getAccount(to, config);
      await client.transfer(to.address, amount);

      const [ clientBalance, receiverBalance ] = await Promise.all([client.getMyBalance(), receiver.getMyBalance()]);
      rtm.sendMessage(`${mention(client.address)} now has ${clientBalance} magic internet money`, message.channel);
      rtm.sendMessage(`${mention(receiver.address)} now has ${receiverBalance} magic internet money`, message.channel);
    });
  } catch (e) {
    console.log(`Error occurred: ${e}`);
  }

});
