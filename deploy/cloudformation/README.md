# Deployment to CloudFormation

## Template and parameters

`cloudformation.yaml` contains a template for a new node. It creates new VPC and bootstraps a server from `s3://orbs-network-config-staging/v1/` (please check out `deploy/bootstrap` directory for sources).

## Create new stack

To create new stack, you need to allocate new VPC IP address, and add it to `parameters.json`.

```
aws cloudformation create-stack --template-body file://$(pwd)/cloudformation.yaml --parameters "$(cat parameters.json)" --stack-name my-orbs-network-node
```
