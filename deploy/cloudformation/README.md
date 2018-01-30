# Deployment to CloudFormation

## Template and parameters

`cloudformation.yaml` contains a template for a new node. It creates new VPC and bootstraps a server from `s3://orbs-network-config-staging/v1/` (please check out `deploy/bootstrap` directory for sources).

## Create new stacks

**THIS WILL DESTROY OLD STACKS WITH SAME NAMES**

```
npm install
./create-stacks.sh
```
