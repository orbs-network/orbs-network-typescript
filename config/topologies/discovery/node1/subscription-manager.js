module.exports = {
  "name": "subscription-manager",
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51151",
  "project": "subscription-manager-service-typescript",
  "peers": [
    {
      "service": "sidechain-connector",
      "endpoint": "sidechain-connector:51151"
    }
  ]
}
