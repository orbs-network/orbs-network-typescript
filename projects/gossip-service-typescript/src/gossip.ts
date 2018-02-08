import * as WebSocket from "ws";
import { logger, topology, topologyPeers } from "orbs-common-library";
import { includes } from "lodash";
import { platform, networkInterfaces } from "os";

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

export default class Gossip {
  localAddress: string;
  server: WebSocket.Server;
  clients: Map<string, WebSocket> = new Map();
  listeners: Map<string, any> = new Map();
  peers: any = topologyPeers(topology.peers);
  node_ip: string;
  node_name: string;

  constructor(port: number, localAddress: string, node_ip: string) {
    this.server = new WebSocket.Server({ port });
    this.node_ip = node_ip;
    this.localAddress = localAddress;
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

  networkInterface(): any {
    const eth = platform() == "darwin" ? "en0" : "eth0";
    return networkInterfaces()[eth].filter(iface => iface.family === "IPv4")[0];
  }

  public ip(): string {
    return this.node_ip || this.networkInterface().address;
  }

  public possiblePeers(): string[] {
    const ip = this.ip(),
      me = this.localAddress;

    // TODO: better self-exclusion policy
    return topology.gossipPeers.filter((p: string) => !includes(p, ip) && !includes(p, me));
  }

  public activePeers() {
    return this.clients.keys();
  }

  async discoverPeers(): Promise<string[]> {
    return Promise.resolve(this.possiblePeers());
  }
}
