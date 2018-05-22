# New node bootstrap script

Environment variables are in the `.env` files.

Secrets are in `.env-secrets`.

`crontab` will be installed automatically with `bootstrap.sh`.

`docker-compose.yml` describes the list of services on the node.

## Configuration

Configured through environment variables.

* `LOG_LEVEL` to set log level, **optional**.
* `LOGZIO_API_KEY` to send logs to Logz.io, **optional**.
* `GOSSIP_PEERS` is a list of peer nodes, **required**. `ws://your-node-ip:60001,ws://another-node-ip:60001`
* `NUM_OF_NODES` is a total number of nodes in a cluster, **required**. Is used to determine consensus.
* `SMART_CONTRACTS_TO_LOAD` is a list of hard coded smart contracts that are running on the nodes.

Service-specific configuration:

* `SERVICE_NAME` is used for all services for logging purposes, **required**. Included by default in `docker-compose.yml`
* `SIGN_MESSAGES` is used by `gossip` to verify incoming messages from other nodes. Refer to [documentation](../README.md) to learn more about key management.
* `GOSSIP_PEER_POLL_INTERVAL` is used by `gossip` to determine how often to poll (in ms) for peer/braodcast groups health check.
* `ETHEREUM_CONTRACT_ADDRESS` is used by `consensus` to bill customers.
* `CONSENSUS_SIGN_BLOCKS` is used by `consensus` to sign new blocks.
* `BLOCK_STORAGE_DB_PATH` is used by `storage` to point where the store the blocks.
* `BLOCK_STORAGE_POLL_INTERVAL` is used by `storage` to determine how often to poll (in ms) for new blocks from other nodes to prevent being out of sync.
* `BLOCK_STORAGE_VERIFY_SIGNATURES` is used by `storage` to turn on/off block signature verification.
* `STATE_STORAGE_POLL_INTERVAL` is used by `storage` to determine how often to poll (in ms) for new blocks from the block storage component and sync the blocks into the storage.

## Debugging

Check out `/var/log/orbs-bootstrap.log` or `/var/log/cfn-init*`
