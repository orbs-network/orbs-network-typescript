# Development Topology

The following lays out the initial development and testing topology.
It's goal is to assist in quick development iterations, easing up on CI/CD, etc.
so we could focus on blockchain infrastructure development instead of DevOps.

## Hierarchy

Continuing on the structure laid out in the root [README](../README.md) of this repository:

- **Service** e.g. Consensus, Discovery, State Storage, etc.
- **Node** e.g. Orbs blockchain full node
- **Cloud Region**  e.g. us-east1 on AWS
- **Cloud Provider** e.g. AWS, GCP, DigitalOcean
- **Organization** e.g. Kik
- **Network** e.g. The entire Orbs network consisting of all organizations.

The following image is an example of an *organization* topology.
This topology can connect to other organizations to form a *network*.

<p align="center"><img src="topology.png?raw=true" alt="Topology"/></p>

## Service

### Containers

Dockerizing apps is recommended, though can be avoided or at least have certain components disabled if the following cases apply:

#### [Network performance](https://docs.docker.com/engine/userguide/networking/)

Docker bridge networking adds a middleman layer that incurs a performance penalty and adds delay.
In most cases this penalty is negligble, but it should be turned off in cases where high performance is required.
Instead, we should use the the host network or a custom bridge e.g. [Weave](https://github.com/weaveworks/weave)
(though this might incur some more over-engineering).

Also UDP traffic is known to have some issues. This will probably be resolved in a future version.

#### Productivity

Taking the time to dockerize apps is sometime unnecessary and costs precious time.
If an application has another standard way of deploying without Docker it is advised to do so.

### Supervisor

[Supervisor](http://supervisord.org/) (or supervisord) is a common choice for deplyoing non-dockerized apps.

## Node

The following services will be used for initial development and testing.

**NOTE** component images and techonlogies are just an example:
Implementations are language-agnostic. As long as a service complies with the shared communication interface,
it doesn't matter which language or tools its built on, be it Python, Go, JS, etc.

<p align="center"><img src="node.png?raw=true" alt="Topology"/></p>

### Network Discovery

Once we get past initial setup, [Consul](https://www.consul.io/) can be used for large-scale node discovery:

1. More modern than [ZooKeeper](https://www.consul.io/intro/vs/zookeeper.html), and written in a modern language (Go).
1. Rapidly becoming the "way to go" solution for most companies.
1. We have experience with it internally.

### APM

[New Relic](https://newrelic.com/) is a good popular choice for APM:

1. Supports most popular languages that could be used for development: Python, Go, JS, etc.
1. Profiling
1. Cross-app tracing
1. Error handling

#### Alternatives

[Sentry](https://sentry.io/) and [Rollbar](https://rollbar.com/) are New Relic alternatives

- [Rollbar live demo](https://rollbar.com/demo/demo/) looks to have pretty
  similar features to New Relic. Downside is minimal language support compared
  to New Relic and Sentry.
- [Sentry demo video](https://www.youtube.com/watch?v=D060ACRPj6I) also shows
  it has similar error reporting features as New Relic.

### Tracing

[Jaeger](http://jaeger.readthedocs.io/) looks like an interesting [OpenTracing](http://opentracing.io/)-compatible
tracing solution.

**NOTE** An APM solution might be enough for starters.

### System Monitoring

[DataDog](https://www.datadoghq.com/) is a good popular choice:

1. Very easy to set up and get started.
1. Popular language support.
1. Great UI.
1. Internal team experience.

#### Alternatives

[Prometheus](https://prometheus.io/) is a good unmanaged alternative.
Requires a discovery service e.g. Consul for large-scale deployment.

### CI/CD

#### Deployment

[Ansible](https://www.ansible.com/) is a good deployment tool:

1. Simple to use.
1. Large ecosystem.
1. Can be used for generic automation as well e.g. configuration, live tweaks, etc.
1. Internal team experience.

#### Cluster Management and Scheduling

[Nomad](https://www.nomadproject.io/) will be used, due to the following reasons, ordered by priority:

1. Nomad supports stand-alone, virtualized, and containerized (Docker) applications.
This allows for more flexibility up-front and down the road.
This is in contrast to [Kubernetes](https://kubernetes.io/) and [other alternatives](https://www.nomadproject.io/intro/vs/index.html)
which force you to use Docker.

1. Nomad follows the UNIX philosophy of *do one thing and do it well*.
This is contrast compared to other alternatives which come as an all-in-one orchestration package consisting
of scheduling, discovery, configuration management, etc.

#### Provisioning

##### Image Builds

[Packer](https://www.packer.io/) is an excellent choice for image baking:

1. Support for Ansible and other alternatives.
1. Easy to use.

##### Infrastructure

[Terraform](https://www.terraform.io/), similar to Packer, is becoming the industry-standard choice
for launching cloud-agnostic infrastructure.
