# Deployment to CloudFormation

## Deploying a node from scratch

Create new EC2 pair of keys named `orbs-network-staging-key`.

Please fisrt make sure you have admin credentials on AWS.

### Credentials

You can use your credentials stored in CSV, try

```bash
node dist/multi-account.js --aws-credentials-path=path/to/csv
```

To export your credentials as environment variables:

```bash
$(node dist/multi-account.js --aws-credentials-path=path/to/csv --aws-credentials-export)
```

## Deploying with a single script


```bash
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export REGION=eu-central-1
export NETWORK=testnet
export AWS_ACCOUNT_ID=
export DNS_ZONE=
export PUBLIC_KEY_PATH=
export S3_BUCKET_NAME=orbs-network-config

# build docker image (in the root of the project)

./docker/build-server-base.sh && ./docker-build.sh

# install packages for deployment script to work

cd deploy
npm install

# configure environment variable and secrets

touch bootstrap/.env-secrets

# edit bootstrap/.env and set GOSSIP_PEERS to empty string

# create basic infrastructure

node dist/deploy.js \
    --region $REGION \
    --ssh-public-key $PUBLIC_KEY_PATH \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --s3-bucket-name $S3_BUCKET_NAME \
    --create-basic-infrastructure

# deploy node

node dist/deploy.js \
    --region $REGION \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --s3-bucket-name $S3_BUCKET_NAME \
    --tag-docker-image --push-docker-image --deploy-node

# find out ip allocations of reserved ips (value of NodeElasticIP)

node dist/deploy.js \
    --region $REGION \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --list-resources

# update bootstrap/.env with GOSSIP_PEERS=ws://IP_ADDRESS:60001
# keep listing this addresses as you deploy new nodes

# update node configuration

node dist/deploy.js \
    --region $REGION \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --s3-bucket-name $S3_BUCKET_NAME \
    --update-configuration

Cron pulls bootstrap configuration automatically every five minutes to recreate containers.

# update node stack configuration

node dist/deploy.js \
    --region $REGION \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --s3-bucket-name $S3_BUCKET_NAME \
    --peers-cidr 1.2.3.4/32,5.6.7.8/32 \
    --ssh-cidr 10.20.30.40/32 \
    --update-node

# SSH into your newly created node
ssh -t -o StrictHostKeyChecking=no ec2-user@$REGION.global.nodes.$NODE_ENV.$DNS_ZONE

# You have successfully installed new testnet!

# Extras

# replace old node

node dist/deploy.js \
    --region $REGION \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --s3-bucket-name $S3_BUCKET_NAME \
    --remove-node --deploy-node


# deploy parity node

node dist/deploy.js \
    --region $REGION \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --s3-bucket-name $S3_BUCKET_NAME \
    --deploy-node --parity
```

## Delivery to the clients

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

### How it works

1. In case we release new version, steps 2, 3 and 5 of the current flow should happen. Implemented as a combination of `--remove-node` and `--deploy-node` or `--update-configuration` and  `--update-node` calls.

2. In case we add new node, steps 2 and 5 of the current flow should happend for old nodes. Implemented as `--update-configuration` and  `--update-node` calls.

3. Steps 2 and 3 require access to clients' AWS credentials.

4. Step 5 can be done automatically via combination of `crontab` and `docker-compose`.

### Current staging environment

We have 6 nodes running in 6 different AWS regions (s-east-1, eu-central-1, ap-northeast-1, ap-northeast-2, ap-southeast-2, ca-central-1). They are deployed one by one through `./deploy-staging.sh`.

We should open 6 AWS sub-accounts and move servers there.

### What's missing

TODO: add policy JSON for `deploy` role. Not the scope of this PR.
TODO: update script interface

### Prerequisites to install a new node

1. git
2. node 9
3. docker
4. private/public key generated with ssh-keygen
5. aws cli (`pip install awscli`)

AWS services **required** for node deployment to work:

1. S3
2. ECR
3. EC2
4. CloudFormation

Route53 is **optional** unless you want to use DNS zone that points to your node.

## Private and public key management

For an example of keys that are being used for Gossip messages, please take a look at `generate-staging-keys.sh`.

Public keys are stored `bootstrap/public-keys/message/${FULL_NODE_NAME}` per node.

Private key is stored in `temp-keys/private-keys/message/${FULL_NODE_NAME}`.

To enable signing Gossip messages, set `SIGN_MESSAGES` to `true` in `docker-compose.yml`.

### Delivery

Public keys and private keys are delivered through different methods. Public keys, like the rest of the `bootstrap`, are uploaded to S3.

Private keys are being embedded into CloudFormation template as so-called no-echo params, which means no one can retrieve them through CLI call or Amazon Console.

To deploy private keys, use `--secret-block-key` and `--secret-message-key` parameters of the deploy script.

On the instance, private keys are being placed to `/opt/keys/private-keys/` and should be mounted inside the container (see `docker-compose.yml`).
