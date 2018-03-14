import { PublicApiClient } from "orbs-interfaces";
import { OrbsClientSession, initPublicApiClient } from "orbs-typescript-sdk";
import { OrbsHardCodedContractAdapter } from "orbs-typescript-sdk";
import { FooBarAccount } from "./foobar-account";
import { RTMClient } from "@slack/client";

interface Config {
  subscriptionKey: string;
  publicApiClient: PublicApiClient;
}

const { SLACK_VERIFICATION_TOKEN, SLACK_TOKEN, CONVERSATION_ID } = process.env;

const BOT_ADDRESS = "0000";
const PULL_REQUEST_AWARD = 100;

const config = {
  subscriptionKey: "00000",
  publicApiClient: initPublicApiClient({
    endpoint: "us-east-1.global.nodes.staging.orbs-test.com:51151"
  })
};

async function getAccount(senderAddress: string, config: Config): Promise<FooBarAccount> {
  const orbsSession = new OrbsClientSession(senderAddress, config.subscriptionKey, config.publicApiClient);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
  const account = new FooBarAccount(senderAddress, contractAdapter);

  return Promise.resolve(account);
}

async function getBotAccount(config: Config) {
  const botAccount = await getAccount(BOT_ADDRESS, config);
  return botAccount;
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
    if (message.text === "get my balance") {
      const account = await getAccount(message.user, config);
      const userBalance = await account.getMyBalance();
      console.log(`You now have ${userBalance} magic internet money`);

      return;
    }

    if (message.text === "get bot balance") {
      const botAccount = await getBotAccount(config);
      const botBalance = await botAccount.getMyBalance();
      console.log(`Bot now has ${botBalance} magic internet money`);

      return;
    }

    const botInitMatch = message.text.match(/good bot gets (\d+)/);

    if (botInitMatch) {
      const botAccount = await getBotAccount(config);
      const botBalance = await botAccount.getMyBalance();
      const amount = Number(botInitMatch[1]);

      console.log(`Init bot balance with ${amount} magic internet money`);

      if (botBalance === 0) {
        await botAccount.initBalance(BOT_ADDRESS, amount);
      }

      const newBotBalance = await botAccount.getMyBalance();
      console.log(`Bot now has ${newBotBalance} magic internet money`);

      return;
    }

    const transferMatch = message.text.match(/transfer (\d+) to <@(\w+)>/);

    if (transferMatch) {
      const amount = Number(transferMatch[1]);
      const to = transferMatch[2];

      const account = await getAccount(message.user, config);
      await account.transfer(to, amount);

      const userBalance = await account.getMyBalance();
      console.log(`You now have ${userBalance} magic internet money`);

      return;
    }

    const freeMoneyMatch = message.text.match(/I opened a pull request/);

    if (freeMoneyMatch) {
      const to = freeMoneyMatch[1];
      const amount = Number(freeMoneyMatch[2]);

      const account = await getAccount(message.user, config);
      const botAccount = await getBotAccount(config);

      console.log(`Transfering ${PULL_REQUEST_AWARD} to ${message.user}`);
      await botAccount.transfer(message.user, PULL_REQUEST_AWARD);

      const userBalance = await account.getMyBalance();
      console.log(`You now have ${userBalance} magic internet money`);

      const botBalance = await botAccount.getMyBalance();
      console.log(`Bot now has ${botBalance} magic internet money`);
      return;
    }

  } catch (e) {
    console.log(`Error occurred: ${e}`);
  }

});
