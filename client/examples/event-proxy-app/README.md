# Event proxy app

Calls `event-counter` smart contract.

## How to build

```bash
./build.sh
```

## How to run

```bash
export ORBS_API_ENDPOINT=
export REDIS_URL=
export NETWORK_ID=
export VIRTUAL_CHAIN=
yarn run server
```

Note, that `NETWORK_ID=T` on staging and `M` in production.
