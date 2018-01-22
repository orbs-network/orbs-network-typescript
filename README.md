# Orbs

This wrapper project will set up a full working environment including all sub projects. There is no need to clone every individual sub project, this repo is the only one you need.

## Installation

> Run when you want a fresh start. This will git clone all sub projects into `./projects`:

`./install.sh`

* Make sure you have node 8+ and npm 5+ installed before building.
* This command will delete `./projects` so make sure all changes are committed.

## Configuration

> You can use the exported `Config` singleton, from the `common-library-typescript` library, in order to access the configuration key-value store. As a convention, it'll look for the configuration file based on the environment type:

* Development (default): `config/development.json`.
* Test (`NODE_ENV=test`): `config/test.json`.
* Staging/Production (`NODE_ENV=production`): `config/production.json`.

### Configuration Keys

#### `logger`

> Global logger configuration:

* `level`: The level of messages that should be logged. Possible values are: `debug`, `info`, `warn`, `error`. Default is `info`.
* `fileName`: The filename of the log file to write the output to. Default is `logs/default.log`.
* `maxSize`: The max size (in bytes) of the log file. If the size is exceeded then a new file is created and a counter will become a suffix of the log file. Default is `10MB`.
* `maxFiles`: The limit of the number of files created when the size of the log file is exceeded. Default is `10`.
* `logzio`: Logz.io configuration:
  * `enabled`: Whether shipping logs to Logz.io should be enabled.
  * `apiKey`: The Logz.io API key (i.e., account token).

> For example:

```json
{
  "logger": {
    "level": "debug",
    "fileName": "logs/development.log",
    "maxSize": 1024000,
    "maxFiles": 4,
    "logzio": {
      "enabled": false,
      "apiKey": "API_KEY"
    }
  }
}
```

## Build (slow)

> Run when you made a big change in one of the sub projects and you want to fully build all of them:

`./build.sh`

* This will `npm install` all the sub projects which is a little slow but safer.
* This will also lint your code which is a little slow but safer.

## Rebuild (faster)

> Run when you made a small code change in one of the sub projects and you want to rebuild quickly:

`./rebuild.sh`

* This will not `npm install` and will not lint your code.
* If you suspect your change did not go in, run `./build.sh` instead, it's more thorough.

## Run Simulation

> This will start an end to end simulation of the network with a few services:

`./simulate.sh two-chatter`

* The network topologies for the simulations are found at `./config/topologies`.
* To see the available list of simulations run `./simulate.sh` without an argument.

## Develop Effectively

> After installing, when developing services actively, use this to make your life easier:

`./watch.sh`

* This will watch for file changes on all typescript sub projects and recompile automatically.
* Work directly on all sub projects inside the folder `./projects`, they're separate git repos.

## Run inside of Docker

`docker-compose up` will build an image and start a simulation of `transaction-gossip` topography.