module.exports = {
  name: 'virtual-machine',
  version: '1.0.0',
  endpoint: '0.0.0.0:51151',
  project: 'virtual-machine-service-typescript',
  peers: [
    {
      service: 'storage',
      endpoint: 'storage:51151',
    },
  ],
};
