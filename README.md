# Orbs

This is a monorepo that contains all Orbs projects, including both server implementation and client SDK.

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

Pleaser refer to [documentation](e2e/README.md) in `e2e` folder to learn more about end to end testing.

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
