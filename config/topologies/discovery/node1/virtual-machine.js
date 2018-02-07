module.exports = {
  "name": "virtual-machine",
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51151",
  "project": "virtual-machine-service-typescript",
  "peers": [
    {
      "service": "state-storage",
      "endpoint": "state-storage:51151"
    }
  ]
}
