import os
import redis
import time
import json
from datetime import datetime
from slackclient import SlackClient

from os import sys, path
sys.path.append(path.abspath(path.dirname(path.abspath(__file__)) + "../../../../crypto-sdk-python"))

import orbs_client
from orbs_client import HttpClient, Contract
from orbs_client.pycrypto import Address, ED25519Key

SLACK_TOKEN = os.environ["SLACK_TOKEN"]
ORBS_API_ENDPOINT = os.environ["ORBS_API_ENDPOINT"]
REDIS_URL = os.environ["REDIS_URL"]

NETWORK_ID = Address.TEST_NETWORK_ID
VIRTUAL_CHAIN_ID = "640ed3"

REDIS = redis.Redis.from_url(REDIS_URL)

def create_contract(address, key_pair):
    http_client = HttpClient(ORBS_API_ENDPOINT, address, key_pair)
    contract = Contract(http_client, "text-message")

    return contract

def get_account(username):
    data = REDIS.hgetall(username)

    if data:
        public_key = data["publicKey"]
        private_key = data["privateKey"]
        key_pair = ED25519Key()
    else:
        key_pair = ED25519Key()
        public_key = key_pair.public_key
        private_key = key_pair.unsafe_private_key

        REDIS.hmset(username, { "publicKey": public_key, "privateKey": private_key })

    address = Address(public_key, VIRTUAL_CHAIN_ID, NETWORK_ID)
    return (address, key_pair)

COMMANDS = {
    "get_messages": "get my messages"
}

def format_message(message):
    return str(datetime.fromtimestamp(message["timestamp"])) + " <#" + message["channel"] + ">: " + message["text"]

def append_message(event):
    try:
        if event["type"] != "message" or ("bot_id" in event) or event["text"] in COMMANDS.values():
            return None

        print event

        address, key_pair = get_account(event["user"])
        contract = create_contract(address, key_pair)

        timestamp = time.time()

        message = json.dumps({
            "timestamp": timestamp,
            "text": event["text"],
            "channel": event["channel"]
        })

        tx_receipt = contract.send_transaction("sendMessage", [ address.to_string(), message, timestamp ])
        return tx_receipt
    except Exception as e:
        print str(e)

def process_command(event):
    try:
        if event["type"] != "message":
            return None

        address, key_pair = get_account(event["user"])
        contract = create_contract(address, key_pair)

        if event["text"] == COMMANDS["get_messages"]:
            raw_messages = contract.call("getMyMessages", [])
            messages = map(lambda m: json.loads(m["message"]), raw_messages)
            response = "\n".join(map(format_message, messages))

            post_message(event["channel"], "<@" + event["user"] + "> latest messages: \n"+ response)

    except Exception as e:
        print str(e)

def post_message(channel, response):
    slack_client.api_call("chat.postMessage", channel=channel, text=response, as_user=True)

slack_client = SlackClient(SLACK_TOKEN)

if slack_client.rtm_connect(with_team_state=False):
    print "Successfully connected, listening for events"
    while True:
        events = slack_client.rtm_read()

        print map(append_message, events)
        map(process_command, events)

        time.sleep(0.2)
else:
    print "Connection Failed"
