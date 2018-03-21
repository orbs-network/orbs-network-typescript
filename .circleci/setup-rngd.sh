#!/bin/bash -xe

sudo apt-get update && sudo apt-get install rng-tools
sudo rngd -o /dev/random -r /dev/urandom
