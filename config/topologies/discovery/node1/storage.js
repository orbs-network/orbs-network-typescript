module.exports = {
  name: 'storage',
  version: '1.0.0',
  endpoint: '0.0.0.0:51151',
  project: 'storage-service-typescript',
  peers: [
    {
      service: 'storage',
      endpoint: 'storage:51151',
    },
    {
      service: 'gossip',
      endpoint: 'gossip:51151',
    },
    {
      service: 'consensus',
      endpoint: 'consensus:51151',
    },
  ],
};
