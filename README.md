# Orbs

This wrapper project will set up a full working environment including all sub projects. There is no need to clone every individual sub project, this repo is the only one you need.

## Installation

> Run when you want a fresh start. This will git clone all sub projects into `./projects`.

Make sure you have node 8+ and npm 5+ installed before building.

`./build.sh`

## Rebuild

> Run when you changed one of the sub projects and you want to rebuild all of them.

`./rebuild.sh`

## Run Simulation

> This will start a few services with some chatter

`./simulate.sh`

## Develop

It's recommended to work on all sub projects directly inside the folder `./projects`.

> IMPORTANT: don't forget to commit and push your changes, they're all separate git repos.
