# On-premises deployment

## Example installation

This documents uses an example installation with [Vagrant](https://www.vagrantup.com/) to provision new VM which contains a functional Orbs Network node.

Actual provisioning happens with `bootstrap-local.sh`. The script assumes that the VM is going to use Debian Stretch.

### Requirements

* Vagrant
* Docker

## Preparations

Clone the repository and build the image as usual with `./docker-build.sh`.

Export the image with `./docker-export.sh`. The image will end up in `docker/images/orbs-network.tar`.

Add `NODE_NAME` to `/opt/orbs/deploy/bootstrap/.env` file.

```bash
echo NODE_NAME=$NODE_NAME >> ../bootstrap/.env
echo NODE_ENV=production >> ../bootstrap/.env
```

Add secret key to `../temp-keys/private-keys/message/secret-key`. You can read more on key management at [README.md in `deploy` folder](../README.md).

## Running the node

Vagrant should take care of provisioning the node.

```bash
vagrant up
```

To check that installation was successful:

```bash
vagrant ssh
sudo su
docker logs -f orbs_gossip_1
```
