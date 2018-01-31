# Deployment to CloudFormation

## Template and parameters

`cloudformation.yaml` contains a template for a new node. It creates new VPC and bootstraps a server from `s3://orbs-network-config-staging/v1/` (please check out `deploy/bootstrap` directory for sources).

## Create new stacks

```
./create-stacks.sh
```

Deployment script creates specific parameters for each stack (common `parameters.json` being updated with values from `stacks.json`) and writes them to `tmp/parameters-${stack.name}.json`.

## Removing old stacks

```
./create-stacks.sh --remove-all
```

## Testing

```
./test.sh
```
