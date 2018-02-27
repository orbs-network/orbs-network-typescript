module.exports = {
  name: 'consensus',
  version: '1.0.0',
  endpoint: '0.0.0.0:51151',
  project: 'consensus-service-typescript',
  peers: [
    {
      service: 'gossip',
      endpoint: 'gossip:51151',
    },
    {
      service: 'storage',
      endpoint: 'storage:51151',
    },
    {
      service: 'sidechain-connector',
      endpoint: 'sidechain-connector:51151',
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
