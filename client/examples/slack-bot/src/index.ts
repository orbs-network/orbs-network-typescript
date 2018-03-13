import { PublicApiClient } from "orbs-interfaces";
import { OrbsClientSession, initPublicApiClient } from "orbs-typescript-sdk";
import { OrbsHardCodedContractAdapter } from "orbs-typescript-sdk";
import { FooBarAccount } from "./foobar-account";
import { RTMClient } from "@slack/client";

interface Config {
  subscriptionKey: string;
  publicApiClient: PublicApiClient;
}

async function getAccount(senderAddress: string, config: Config) {
  const orbsSession = new OrbsClientSession(senderAddress, config.subscriptionKey, config.publicApiClient);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "text-message");
  const account = new FooBarAccount(senderAddress, contractAdapter);

  return account;
}

const { SLACK_VERIFICATION_TOKEN, SLACK_TOKEN, CONVERSATION_ID } = process.env;

const config = {
  subscriptionKey: "00000",
  publicApiClient: initPublicApiClient({
    endpoint: "us-east-1.global.nodes.staging.orbs-test.com:51151"
  })
};

const rtm = new RTMClient(SLACK_TOKEN, {autoReconnect: true, useRtmConnect: true});
// rtm.start({scope: "identify,read,post,client"});
rtm.start({});

rtm.on("message", async (message) => {
  // For structure of `event`, see https://api.slack.com/events/message

  // Skip messages that are from a bot or my own user ID
  if ( (message.subtype && message.subtype === "bot_message") ||
       (!message.subtype && message.user === rtm.activeUserId) ) {
    return;
  }

  console.log(JSON.stringify(message));

  // Log the message
  console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`);

  const matches = message.text.match(/transfer (\d+) to <@(\w+)>/);
  console.log(matches);

  if (matches) {
    const to = matches[1];
    const amount = Number(matches[2]);

    try {
      const account = await getAccount(message.user, config);
      await account.transfer(to, amount);

      const userBalance = await account.getMyBalance();
      console.log(`You now have ${userBalance} magic internet money`);
    } catch (e) {
      console.log(`Error occurred: ${e}`);
    }
  }
});
