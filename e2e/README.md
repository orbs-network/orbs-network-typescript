Build project using the main [orbs-network](https://github.com/orbs-network/orbs-network) repo

Run `docker-compose up`, wait for 30 seconds, then `docker-compose simple-simulation scale=6`, wait another 30 seconds, and `docker exec -it orbsnetwork_basic-simulation_4 /bin/bash -c 'cd /opt/orbs/e2e && npm test'`
