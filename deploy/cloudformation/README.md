# Deployment to CloudFormation

## Template and parameters

`cloudformation.yaml` contains a template for a new node. It creates new VPC and bootstraps a server from `s3://orbs-network-config-staging/v1/` (please check out `deploy/bootstrap` directory for sources).

## Create new stacks

```bash
./create-stacks.sh
```

Deployment script creates specific parameters for each stack (common `parameters.json` being updated with values from `stacks.json`) and writes them to `tmp/parameters-${stack.name}.json`.

## Removing old stacks

```bash
./create-stacks.sh --remove-all
```

## Testing

```bash
./test.sh
```

## Parity node

Parity Etherium node is not part of ORBS network and is deployed as a separate service.

TODO: extract to a different repo.

```bash
./create-stacks.parity.sh
```

```bash
./test.parity.sh
```

## Deploying a node from scratch

Create new EC2 pair of keys named `orbs-network-staging-key`.

Please fisrt make sure you have admin credentials on AWS.

```bash
# Set environment variables
export REGION=eu-central-1
export AWS_ACCOUNT_ID=
```

```bash
# Create basic infrastructure (roles, buckets, elastic ips)
# TODO: configurable DNS zone, disable Route 53 for any NODE_ENV except staging
aws cloudformation create-stack --capabilities CAPABILITY_NAMED_IAM --region $REGION --template-body file://`pwd`/basic-infrastructure.yaml --stack-name basic-infrastructure
```

```bash
# This is a stub
# Copy bootstrap script to a new bucket
# TODO: update cloudformation.yaml to boot from regional URL
aws s3 sync bootstrap s3://orbs-network-config-staging-$REGION/v1/
```

```bash
# Push docker image to your new docker repository
export DOCKER_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/orbs-network-$REGION

$(aws ecr get-login --region $REGION)

docker build -t $DOCKER_IMAGE .
docker push $DOCKER_IMAGE
```

```bash
# Create node stack
aws cloudformation create-stack --region $REGION --template-body file://`pwd`/cloudformation.yaml --parameters "$(cat parameters.standalone.json)" --stack-name orbs-network-node
```
