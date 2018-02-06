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

You can pass values through environment, but you have to replace colon (`:`) with double underscore (`__`) for it to work. For example, `logger:logzio:apiKey` becomes `logger__logzio__apiKey`.

### Configuration Keys

#### `logger`

> Global logger configuration:

* `level`: The level of messages that should be logged. Possible values are: `debug`, `info`, `warn`, `error`. Default is `info`.
* `fileName`: The filename of the log file to write the output to. Default is `logs/default.log`.
* `maxSize`: The max size (in bytes) of the log file. If the size is exceeded then a new file is created and a counter will become a suffix of the log file. Default is `10MB`.
* `maxFiles`: The limit of the number of files created when the size of the log file is exceeded. Default is `10`.
* `console`: Whether logging to the console/stdout should be enabled.
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

## Develop Effectively

> After installing, when developing services actively, use this to make your life easier:

`./watch.sh`

* This will watch for file changes on all typescript sub projects and recompile automatically.
* Work directly on all sub projects inside the folder `./projects`, they're separate git repos.

## Run Inside of Docker

`docker-compose up` will build an image.

### Docker in AWS CloudFormation

Install `ecs-cli`

```bash
sudo curl -o /usr/local/bin/ecs-cli https://s3.amazonaws.com/amazon-ecs-cli/ecs-cli-darwin-amd64-latest
chmod +x /usr/local/bin/ecs-cli
```

If you want to pull images, log into AWS Elastic Container Registry.

```bash
$(aws ecr get-login --no-include-email --region us-west-2)
```

Deploy new stack:

```bash
ecs-cli compose --file docker-compose.staging.yml --ecs-params ecs-params.yml --region us-west-2 --cluster orbs-network-staging up
```

Please refer to [documentation](deploy/cloudformation/README.md) in `deploy/cloudformation` folder.

### Run Tests In Staging-like Environment

```bash
./docker-build.sh && ./docker-test.sh
```

You can supply `DOCKER_IMAGE` and `DOCKER_TAG` environment variables to `docker-test.sh` if the image is already pre-built.

## Development

### Visual Studio Code

#### Recommended Extensions

* Docker
* ESLint
* Go
* Markdown All in One
* markdownlint
* npm
* npm Intellisense
* Path Intellisense
* Python
* solidity
* Spell Right
* TODO Highlight
* TSLint
* vscode-proto3
