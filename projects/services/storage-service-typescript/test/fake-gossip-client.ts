
import { types } from "orbs-core-library";

export default class FakeGossipClient implements types.GossipClient {
    nodes = new Map<string, types.ClientMap>();
    nodeName: string;

    constructor(nodeName: string) {
      this.nodeName = nodeName;
    }

    broadcastMessage(input: types.BroadcastMessageInput): types.BroadcastMessageOutput {
      for (const nodeName of this.nodes.keys()) {
        this.unicastMessage({
          recipient: nodeName,
          broadcastGroup: input.broadcastGroup,
          buffer: input.buffer,
          messageType: input.messageType,
          immediate: input.immediate
        });
      }
      return {};
    }

    unicastMessage(input: types.UnicastMessageInput): types.UnicastMessageOutput {
      const clientMap = <any> this.nodes.get(input.Recipient);
      if (clientMap) {
        clientMap[input.BroadcastGroup].gossipMessageReceived({
          fromAddress: this.nodeName,
          broadcastGroup: input.broadcastGroup,
          messageType: input.messageType,
          buffer: input.buffer
        });
        return {};
      } else {
        throw new Error(`could not find recipient node ${input.Recipient}`);
      }
    }

    addNode(nodeName: string, clientMap: types.ClientMap) {
      this.nodes.set(nodeName, clientMap);
    }
  }
