#!/bin/bash -e

ssh -t -o StrictHostKeyChecking=no ec2-user@pelmeni.nodes.orbs-test.com "sudo docker exec -ti orbs_public-api_1 /bin/bash -c 'cd /opt/orbs/e2e && npm test'"