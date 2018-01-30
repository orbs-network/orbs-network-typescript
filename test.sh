 #!/bin/bash -xe

node simulate/src/index.js transaction-gossip  &
sleep 30
cd e2e && npm test

exit $?