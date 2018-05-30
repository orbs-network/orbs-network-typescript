import * as WebSocket from "ws";

import { logger, types, StartupCheck, StartupStatus, STARTUP_STATUS } from "../common-library";
import { KeyManager } from "../common-library";
import * as stringify from "json-stable-stringify";
import * as _ from "lodash";

function handleWSError(address: string, url: string) {
  return (err: Error) => {
    if (err) {
      logger.error(`Error sending unicast message to ${address} (${url}),`, err);
    }
  };
}

export class Gossip implements StartupCheck {
  public readonly SERVICE_NAME = "gossip";
  localAddress: string;
  server: WebSocket.Server;
  clients: Map<string, WebSocket> = new Map();
  listeners: Map<string, any> = new Map();
  peers: any;
  readonly port: number;
  keyManager: KeyManager;
  signMessages: boolean;

  constructor(input: { localAddress: string, port: number, peers: types.ClientMap, keyManager: KeyManager, signMessages: boolean }) {
    this.port = input.port;
    this.server = new WebSocket.Server({ port: input.port });
    this.peers = input.peers;
    this.localAddress = input.localAddress;
    this.keyManager = input.keyManager;
    this.signMessages = input.signMessages;

    this.server.on("connection", (ws) => {
      this.prepareConnection(ws);
    });
  }

  helloMessage(): Buffer {
    return new Buffer(stringify({ sender: this.localAddress, hello: true }));
  }

  prepareConnection(ws: WebSocket) {
    let remoteAddress: string = undefined;

    ws.on("terminate", () => {
      if (remoteAddress) {
        logger.info("*** remote", remoteAddress, "disconnected.");
        this.clients.delete(remoteAddress);
      }
    });

    ws.on("message", (message: Buffer) => {
      const rawMessage = JSON.parse(message.toString());
      const { sender, hello, recipient, broadcastGroup, objectType, buffer, signature } = rawMessage;

      if (this.localAddress == sender) {
        logger.info("Connected to myself. Disconnecting");
        ws.close();
        return;
      }

      if (hello) {
        // 'hello' message
        remoteAddress = sender;
        this.clients.set(sender, ws);
        logger.info("Registering connection", this.localAddress, "->", sender, " #clients:", this.clients.size);
        return;
      }

      if (!_.isEmpty(recipient) && recipient !== this.localAddress) {
        return;
      }

      const payload = Buffer.from(buffer.data);

      if (this.signMessages) {
        if (!this.keyManager.verify(payload, signature.toString("base64"), sender)) {
          throw new Error(`Could not verify message from ${sender}`);
        }
      }

      if (!this.listeners.has(broadcastGroup)) {
        const peer = this.peers[broadcastGroup];
        if (!peer) {
          throw new Error(`Invalid broadcast group: [${broadcastGroup}]`);
        }
        this.listeners.set(broadcastGroup, peer);
      }

      this.listeners.get(broadcastGroup).gossipMessageReceived({
        fromAddress: sender,
        broadcastGroup,
        messageType: objectType,
        buffer: payload
      });
    });

    ws.send(this.helloMessage());
  }

  connect(peers: string[]) {
    for (const peer of peers) {
      logger.debug(`Gossip trying to connect to: ${peer}`);
      const ws: WebSocket = new WebSocket(peer);
      ws.addEventListener("open", () => { this.prepareConnection(ws); });
    }
  }

  broadcastMessage(broadcastGroup: string, objectType: string, object: Buffer, immediate: boolean) {
    const signature = this.signMessages ? this.keyManager.sign(object) : undefined;

    const message = new Buffer(stringify({
      sender: this.localAddress,
      broadcastGroup,
      objectType,
      buffer: object,
      signature
    }));

    this.clients.forEach((client: WebSocket, address: string) => {
      logger.debug(`Sending message to group ${broadcastGroup} of type ${objectType} to ${address}`);
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, handleWSError(address, client.url));
      }
    });
  }

  unicastMessage(recipient: string, broadcastGroup: string, objectType: string, object: Buffer, immediate: boolean) {
    const remote: WebSocket = this.clients.get(recipient);
    const signature = this.signMessages ? this.keyManager.sign(object) : undefined;

    const message = new Buffer(stringify({
      sender: this.localAddress,
      recipient,
      broadcastGroup,
      objectType,
      buffer: object,
      signature
    }));

    if (remote) {
      remote.send(message, handleWSError(recipient, remote.url));
    }
    else {
      this.clients.forEach((remote: WebSocket, address) => {
        remote.send(message, handleWSError(recipient, remote.url));
      });
    }
  }

  public activeBroadcastGroups() {
    return Object.keys(this.peers);
  }

  async shutdown(): Promise<void> {
    return new Promise<void>((resolve, reject) => this.server.close((err) => {
      err ? reject(err) : resolve();
    }));
  }

  public activePeers() {
    return this.clients.keys();
  }

  public async startupCheck(): Promise<StartupStatus> {
    const goodClients = _.filter(Array.from(this.clients.values()) || [], (client: WebSocket) => { return client.readyState && client.readyState === WebSocket.OPEN; });

    if (goodClients.length === 0) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: `No working clients` };
    }
    return { name: this.SERVICE_NAME, status: STARTUP_STATUS.OK };
  }
}
