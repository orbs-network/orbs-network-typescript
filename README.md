# Orbs

### Note: This repo is not fully compatible with V1 of the Orbs protocol, contributions are welcomed.


Orbs is a public blockchain built for the needs of apps with millions of users, from SLAs to adjustable fee models to on-demand capacity.

The Orbs platform is designed with the input of consumer applications such as Kik, and inspired by existing best practices, like those of leading cloud computing platforms.

It’s an Infrastructure as a Service solution that makes it possible to launch disruptive, large-scale, consumer-focused applications.

For more information, please check [https://orbs.com](https://orbs.com).

This repository contains all Orbs projects, including both server implementation and client SDK.

## Preparing your system
You are encouraged to run the script `orbs-team-member-bootstrap.sh`, it will install all necessary software on your MacOS and then run the full build.

During the installation process, you will occasionally be asked for your credentials, please stay next to your machine at least until the build begins.
> Note: if Docker is not already installed, the script will install it and then exit so you can run the Docker app manually. This is required for creating the `docker` shell command.
You should then rerun the script to continue the installation.

The entire installation takes about 5 minutes on a modern mac. At the end of the installation, and before the build begins, you will be asked to either proceed with the build, or exit. Build time is about 15 minutes or more, depending on connection speed.

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

> By default docker will limit itself to the amount of resources it takes from the system, usually that limit is not enough for orbs to run its test suite, we will later cover how to [Run Inside of Docker](#run-inside-of-docker) and change the configuration.

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

# Running the orbs-network
## Run Inside of Docker

Build process is divided into 3 parts:

* build server: `./docker/build-server-base.sh && ./docker-build.sh`
* build sdk: `./docker/build-sdk-base.sh && ./docker/build-sdk.sh`
* build e2e: `./docker/build-sdk-base.sh && ./docker/build-e2e.sh`

You don't have to rebuild your base images most of the time unless something changed in `docker` folder or one of the docker files.
> The default memory configuration of the Docker app on your Mac is insufficient to run e2e tests. Open the Docker `Preferences --> Advanced --> Memory` and set it to 4.0 GiB and 3 CPUs. Leaving the default 2.0 GiB may result in Docker containers getting stuck during the e2e run on your machine.

This build will generate all the docker images required to run the orbs-network blockchain. there are two options to run e2e tests.

Please refer to [e2e documentation](e2e/README.md) in `e2e` folder to learn more about end to end testing and the docker configuration we use.

### Run from host

In the `./e2e` folder the script `test-from-host.sh` will execute the tests from your current machine. This test will fire up the nodes (docker images) and is slightly faster then running the entire e2e process from docker.

### Run from docker

In the `./e2e` folder the script `test-from-docker.sh` will execute the tests from the docker image. This should simulate exactly what the deployed environment will be like to the extent of configuration (`.env` file, see the [configuration section above](#configuration))

### Deployment to AWS

Please refer to [documentation](deploy/README.md) in `deploy` folder.

## Development

Since this is a monorepo, the build process is configured into three main groups: `server`, `sdk` and `e2e`.

Each group modules and build order are defined in the `config/projects.[name].json`. `PROJECT_TYPE` variable is responsible for building a certain part of the system: `server`, `sdk` or `e2e`.

There are shortcut scripts that are tailored for a specific type of build.

* `./build-sdk.sh`
* `./build-server.sh`
* `./build-e2e.sh`

### Visual Studio Code

We use vsc to develop and build orbs-network.

#### Recommended Extensions

We have committed the `.vscode/extensions.json` file which contains the recommended extensions for the development of our code.

## Troubleshooting

* For testing, we use a fork of `ts-sinon`, so if you get relevant build errors such as `Cannot find name 'Blob'` or `Cannot find name 'XMLHttpRequest'`, make sure package.json contains the line `"ts-sinon": "https://github.com/orbs-network/ts-sinon"` and not some version number.
