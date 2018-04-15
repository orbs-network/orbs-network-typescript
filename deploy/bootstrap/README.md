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
* `ETHEREUM_CONTRACT_ADDRESS` is used by `consensus` to bill customers.
* `BLOCK_STORAGE_DB_PATH` is used by `storage` to point where the store the blocks.
* `BLOCK_STORAGE_POLL_INTERVAL` is used by `storage` to determine how ofter to poll for new blocks from other nodes to prevent being out of sync.

## Debugging

Check out `/var/log/orbs-bootstrap.log` or `/var/log/cfn-init*`
