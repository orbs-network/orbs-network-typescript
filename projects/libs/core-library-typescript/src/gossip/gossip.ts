import * as WebSocket from "ws";

import { logger, types } from "../common-library";

function stringToBuffer(str: string): Buffer {
  const buf = Buffer.alloc(1 + str.length);
  buf.writeUInt8(Math.min(str.length, 255), 0);
  buf.write(str, 1, 255, "utf8");
  return buf;
}

function handleWSError(address: string, url: string) {
  return (err: Error) => {
    if (err) {
      logger.error(`WebSocket error`, {err});
      logger.error(`Error sending unicast message to ${address} (${url})`);
    }
  };
}

export class Gossip {
  localAddress: string;
  server: WebSocket.Server;
  clients: Map<string, WebSocket> = new Map();
  listeners: Map<string, any> = new Map();
  peers: any;
  readonly port: number;
  gossipPeers: string[];

  constructor(input: {localAddress: string, port: number, peers: types.ClientMap, gossipPeers: string[]}) {
    this.port = input.port;
    this.server = new WebSocket.Server({ port: input.port });
    this.peers = input.peers;
    this.gossipPeers = input.gossipPeers;
    this.localAddress = input.localAddress;
    this.server.on("connection", (ws) => {
      this.prepareConnection(ws);
    });
  }

  helloMessage(): Buffer {
    return stringToBuffer(this.localAddress);
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
      let offset = 0;

      function readString(buf: Buffer): string {
        const len: number = buf.readUInt8(offset);
        const str: string = buf.toString("utf8", offset + 1, offset + 1 + len);
        offset += 1 + len;
        return str;
      }

      const sender = readString(message);
      if (offset === message.length) {
        // 'hello' message
        remoteAddress = sender;
        this.clients.set(sender, ws);
        logger.info("Registering connection", this.localAddress, "->", sender);
        return;
      }
      const [recipient, broadcastGroup, objectType, objectRaw] = [readString(message), readString(message), readString(message), message.slice(offset)];

      if (recipient !== "" && recipient !== this.localAddress) {
        return;
      }

      if (! this.listeners.has(broadcastGroup)) {
        const peer = this.peers[broadcastGroup];
        if (! peer) {
          throw new Error(`Invalid broadcast group: [${broadcastGroup}]`);
        }
        this.listeners.set(broadcastGroup, peer);
      }

      this.listeners.get(broadcastGroup).gossipMessageReceived({FromAddress: sender.toString(), BroadcastGroup: broadcastGroup, MessageType: objectType, Buffer: objectRaw});
    });

    ws.send(this.helloMessage());
  }

  connect(peers: string[]) {
    for (const peer of peers) {
      const ws: WebSocket = new WebSocket(peer);
      ws.addEventListener("open", () => { this.prepareConnection(ws); });
    }
  }

  broadcastMessage(broadcastGroup: string, objectType: string, object: Buffer, immediate: boolean) {
    this.clients.forEach((client: WebSocket, address: string) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(Buffer.concat([stringToBuffer(this.localAddress), stringToBuffer(""), stringToBuffer(broadcastGroup), stringToBuffer(objectType), object]), handleWSError(address, client.url));
      }
    });
  }

  unicastMessage(recipientAddress: string, broadcastGroup: string, objectType: string, object: Buffer, immediate: boolean) {
    const remote: WebSocket = this.clients.get(recipientAddress);
    const message: Buffer = Buffer.concat([stringToBuffer(this.localAddress), stringToBuffer(recipientAddress), stringToBuffer(broadcastGroup), stringToBuffer(objectType), object]);
    if (remote) {
      remote.send(message, handleWSError(recipientAddress, remote.url));
    }
    else {
      this.clients.forEach((remote: WebSocket, address) => {
        remote.send(message, handleWSError(recipientAddress, remote.url));
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
}
