/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const GOSSIP_PEERS = process.env.GOSSIP_PEERS ? process.env.GOSSIP_PEERS.split(',') : undefined;

module.exports = {
  name: 'gossip',
  version: '1.0.0',
  endpoint: '0.0.0.0:51151',
  project: 'gossip-service-typescript',
  peers: [
    {
      service: 'consensus',
      endpoint: 'consensus:51151',
    },
    {
      service: 'storage',
      endpoint: 'storage:51151',
    },
  ],
  gossipPort: 60001,
  gossipPeers: GOSSIP_PEERS || [
    'ws://172.1.1.2:60001',
    'ws://172.1.1.3:60001',
    'ws://172.1.1.4:60001',
    'ws://172.1.1.5:60001',
    'ws://172.1.1.6:60001',
    'ws://172.1.1.7:60001',
  ],
};
