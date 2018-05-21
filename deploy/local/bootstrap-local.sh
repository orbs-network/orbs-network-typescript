#!/bin/bash

apt-get install -y python-pip curl && pip install docker-compose && (curl -fsSL get.docker.com | bash)

export $(cat /opt/docker/.env)

docker image load -i /opt/docker/orbs-network.tar
docker-compose -f /opt/orbs/docker-compose.yml up -d
