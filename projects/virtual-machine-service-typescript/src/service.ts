import { logger, topology, grpc, topologyPeers, types } from "orbs-common-library";
import * as _ from "lodash";
import bind from "bind-decorator";

export default class VirtualMachineService {

  peers: types.ClientMap;
  private stateStorage = topologyPeers(topology.peers).stateStorage;


  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async executeTransaction(rpc: types.ExecuteTransactionContext) {
    logger.info(`${topology.name}: execute transaction ${JSON.stringify(rpc.req)}`);

    const args = JSON.parse(rpc.req.argumentsJson);

    // currently only a "simple" contract type is supported
    try {
        const modifiedAddresses = await this.executeTestContract(rpc.req.contractAddress, rpc.req.sender, rpc.req.lastBlockId, args);
        rpc.res = {success: true, modifiedAddressesJson: JSON.stringify(_.fromPairs([...modifiedAddresses]))};
    } catch (err) {
      logger.error("executeTestContract() error: " + err);
        rpc.res = {success: false, modifiedAddressesJson: undefined};
    }
  }

  async executeTestContract(address: string, sender: string, lastBlockId: number, args: any) {
    const senderBalanceKey =  `${sender}-balance`;
    const recipientBalanceKey = `${args.recipient}-balance`;

    const {values} = await this.stateStorage.readKeys({
        address: address,
        keys: [senderBalanceKey, recipientBalanceKey],
        lastBlockId: lastBlockId
    });

    if (args.amount <= 0) {
        throw new Error("transaction amount must be > 0");
    }

    const senderBalance = Math.random() * 1000; // Number.parseFloat(values.senderBalanceKey) || 0;
    if (senderBalance < args.amount) {
        throw new Error(`balance is not sufficient ${senderBalance} < ${args.amount}`);
    }
    // TODO: no integer overflow protection
    // TODO: conversion of float to string is lossy

    const modifiedAddresses = new Map<string, string>();
    modifiedAddresses.set(senderBalanceKey, (senderBalance - args.amount).toString());

    const recipientBalance = Number.parseFloat(values.recipientBalanceKey) || 0;
    modifiedAddresses.set(recipientBalanceKey, (recipientBalance + args.amount).toString());

    logger.info(`${topology.name}: transaction verified ${sender} -> ${args.recipient}, amount: ${args.amount}`);

    return modifiedAddresses;
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  async askForHeartbeats() {
    return await Promise.all([
      this.askForHeartbeat(this.peers.publicApi),
      this.askForHeartbeat(this.peers.gossip)
    ]);
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    // setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }
}
