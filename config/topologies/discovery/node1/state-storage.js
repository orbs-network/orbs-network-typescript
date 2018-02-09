module.exports = {
  "name": "state-storage",
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51151",
  "project": "state-storage-service-typescript",
  "peers": [
    {
      "service": "block-storage",
      "endpoint": "block-storage:51151"
    }
  ]
}
