# New node bootstrap script

Environment variables are in the `.env` files.

## Debugging

```
ssh -t -o StrictHostKeyChecking=no ec2-user@pelmeni.nodes.orbs-test.com "tail -f /var/log/orbs-bootstrap.log"
```