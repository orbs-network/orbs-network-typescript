# Orbs

This wrapper project will set up a full working environment including all sub projects. There is no need to clone every individual sub project, this repo is the only one you need.

## Installation

> Run when you want a fresh start. This will git clone all sub projects into `./projects`:

`./install.sh`

* Make sure you have node 8+ and yarn installed before building.
* This command will delete `./projects` so make sure all changes are committed.

## Configuration

Please refer to [documentation](deploy/bootstrap/README.md) in `deploy/bootstrap` folder.

## Build (slow)

> Run when you made a big change in one of the sub projects and you want to fully build all of them:

`./build.sh`

* This will `yarn install` all the sub projects which is a little slow but safer.
* This will also lint your code which is a little slow but safer.

## Develop Effectively

> After installing, when developing services actively, use this to make your life easier:

`./watch.sh`

* This will watch for file changes on all typescript sub projects and recompile automatically.
* Work directly on all sub projects inside the folder `./projects`, they're separate git repos.

## Run Inside of Docker

`./docker-build.sh` will build an image.

### Deployment to AWS

Please refer to [documentation](deploy/README.md) in `deploy` folder.

### Run Tests In Staging-like Environment

```bash
./docker-build.sh && ./docker-test.sh
```

`docker-test.sh` has environment variables that allow you to customize its behaviour:
* `DOCKER_IMAGE` and `DOCKER_TAG` environment variables to `docker-test.sh` if the image is already pre-built
* `FORCE_RECREATE` recreates all containers (off by default)
* `STAY_UP` if you do not want containers to go down (off by default)
* `LOCAL` if you want to mount local volumes from `docker-compose.test.volumes.local.yml`

Pairing `LOCAL` with `watch.sh` is highly recommended for local development.


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
