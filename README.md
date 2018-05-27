# Orbs

This is a monorepo that contains all Orbs projects, including both server implementation and client SDK.

## Preparing your system
You are encouraged to run the script `orbs-team-member-bootstrap.sh`, it will install all necessary software on your MacOS and then run the full build.

Not all installed software is strictly necessary for the build to run. Rather, it is our opinionated view of a useful development environment.

During the installation process, you will occasionally be asked for your credentials, please stay next to your machine at least until the build begins.
> Note: if Docker is not already installed, the script will install it and then exit so you can run the Docker app manually. This is required for creating the `docker` shell command.
You should then rerun the script (don't worry, it is safe to do so).

The entire installation takes about 5 minutes. At the end of the installation, and before the build begins, you will be asked to either proceed with the build, or exit. Build time is about 15 minutes or more, depending on connection speed.

### Running the script
On a fresh MacOS, run the following:

1. `xcrun --version`
    > This tests if XCode Command Line Tools are installed. If `xcrun` is not found, run `xcode-select --install`. This will also install `git`.
2. `mkdir -p ~/dev/orbs`
3. `cd ~/dev/orbs`
4. `git clone https://github.com/orbs-network/orbs-network.git`
     > If you are prompted that `git` is not found, click "Install", then repeat step 4.
5. cd ~/dev/orbs/orbs-network
6. chmod u+x orbs-team-member-bootstrap.sh
7. ./orbs-team-member-bootstrap.sh

> Make sure you configure the memory requirements of the Docker app, see [Run Inside of Docker](#run-inside-of-docker) section below.

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

Build process is divided into 3 parts:

* build server: `./docker/build-server-base.sh && ./docker-build.sh`
* build sdk: `./docker/build-sdk-base.sh && ./docker/build-sdk.sh`
* build e2e: `./docker/build-sdk-base.sh && ./docker/build-e2e.sh`

You don't have to rebuild your base images most of the time unless something changed in `docker` folder or one of the docker files.
> The default memory configuration of the Docker app on your Mac is insufficient to run e2e.
> Open the Docker app --> Preferences --> Advanced --> Memory: 4.0 GiB and CPUs: 3.
> Leaving the default 2.0 GiB will result in Docker containers getting stuck during the e2e run on your machine.

### Deployment to AWS

Please refer to [documentation](deploy/README.md) in `deploy` folder.

### Run Tests In Staging-like Environment

```bash
./docker-build.sh && ./docker-test.sh
```

Pleaser refer to [documentation](e2e/README.md) in `e2e` folder to learn more about end to end testing.

## Development

`PROJECT_TYPE` variable is responsible for building a certain part of the system: `server`, `sdk` or `e2e`.

There are shortcut scripts that are tailored for a specific type of build.

* `./build-sdk.sh`
* `./build-server.sh`
* `./build-e2e.sh`

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
