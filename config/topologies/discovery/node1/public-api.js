/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

module.exports = {
  name: 'public-api',
  version: '1.0.0',
  endpoint: '0.0.0.0:51151',
  project: 'public-api-service-typescript',
  peers: [
    {
      service: 'gossip',
      endpoint: 'gossip:51151',
    },
    {
      service: 'consensus',
      endpoint: 'consensus:51151',
    },
    {
      service: 'virtual-machine',
      endpoint: 'virtual-machine:51151',
    },
  ],
};
