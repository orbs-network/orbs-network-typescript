# Deployment to CloudFormation

## Template and parameters

`cloudformation.yaml` contains a template for a new node. It creates new VPC and bootstraps a server from `s3://orbs-network-config-staging/v1/` (please check out `deploy/bootstrap` directory for sources).

## Create new stacks

```bash
./create-stacks.sh
```

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

## PROPOSAL: Delivery to the clients

Currently, we have no ability to deliver our code to the clients upon releasing a new version or new configuration.

### Requirements

1. Upon release of a new version it should be installed on clients machines either automatically or manually

2. Upon release of a new configuration it should be installed on clients machines either automatically or manually

3. Since we have no key/transaction signing infrastructure, there are no requirements to distribute keys

4. Since we want to gradually add more nodes to the testnet federation, there should be a way to update old nodes configuration either automatically or manually

5. There should be no single point of failure between nodes: no shared infrastructure, no shared buckets, complete independence.

6. Possilby we also want to recover testnet state, so there should be a mechanism to store transaction database. It does not have to be in the scope of this particular pull request.

### Current flow of deploying new node

1. Create `basic-infrastructure` CloudFormation stack, which exports such things as IAM instance profile, ECR repository, S3 bucket, Elastic IP and DNS domain name bound to this Elastic IP.

2. Upload configuration files to S3.

3. Build Docker image and push it to ECR repository.

4. Create `orbs-network-node` CloudFormation stack, which imports all the values from `basic-infrastructure` and creates an EC2 autoscaling group which consists from a single instance running the ORBS.

5. On bootstrap, EC2 instance clones configuration files from S3, assumes Elastic IP and creates a set of containers using `docker-compose`, pulling the image from ECR repository.

6. After that, node tries to connect to other nodes using `GOSSIP_PEERS` env variable. Peers can be passed as a list of domain names bound to Elastic IPs.

### How it should work

1. In case we release new version, steps 2, 3 and 5 of the current flow should happen.

2. In case we add new node, steps 2 and 5 of the current flow should happend for old nodes.

3. Steps 2 and 3 require access to clients' AWS credentials.

4. Step 5 can be done automatically via combination of `crontab` and `docker-compose`.

### What's missing

1. Currently S3 bucket names are not configurable, there should be a per-client prefix that makes them unique across AWS accounts.

2. DNS zones are not configurable either.

3. There is no script that automates steps 2 and 3 of the current flow (upload configuration to S3, push docker image).

4. Automation of step 5 if we want to turn on auto-update.

### How to proceed

We can start by running 3 nodes of Orbs network that are deployed on our AWS account (possibly in different regions), test them as if they were run completely independenty, polish the process of adding a new region withouth turning off old nodes. That should be enough to be able to deploy new nodes on clients' accounts.
