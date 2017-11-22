# Orbs

This wrapper project will set up a full working environment including all sub projects. There is no need to clone every individual sub project, this repo is the only one you need.

## Installation

> Run when you want a fresh start. This will git clone all sub projects into `./projects`.

`./install.sh`

* Make sure you have node 8+ and npm 5+ installed before building.
* This command will delete `./projects` so make sure all changes are committed.

## Build (slow)

> Run when you made a big change in one of the sub projects and you want to fully build all of them.

`./build.sh`

* This will `npm install` all the sub projects which is a little slow but safer.
* This will also lint your code which is a little slow but safer.

## Rebuild (faster)

> Run when you made a small code change in one of the sub projects and you want to rebuild quickly.

`./rebuild.sh`

* This will not `npm install` and will not lint your code.
* If you suspect your change did not go in, run `./build.sh` instead, it's more thorough.

## Run Simulation

> This will start a few services with some chatter

`./simulate.sh`

* The network topology for the simulation is found at `./config/topology`.

## Develop Effectively

> After installing, when developing services actively, use this to make your life easier.

`./watch.sh`

* This will watch for file changes on all typescript sub projects and recompile automatically.
* Work directly on all sub projects inside the folder `./projects`, they're separate git repos.
