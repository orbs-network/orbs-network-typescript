const NAME = process.env.NODE_NAME || process.env.NODE_IP || require('os').hostname();

module.exports = {
  "name": `${NAME}-block-storage`,
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51157",
  "project": "block-storage-service-typescript",
  "peers": [
  ]
};
