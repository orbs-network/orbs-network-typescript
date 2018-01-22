Build project using the main [orbs-network](https://github.com/orbs-network/orbs-network) repo

Run `docker-compose up` and then enter the container using `docker exec -ti orbsnetwork_basic-simulation_1 bash`.

Inside the container run `cd e2e && npm test`.