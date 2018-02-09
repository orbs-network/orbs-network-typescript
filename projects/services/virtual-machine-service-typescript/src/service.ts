import bind from "bind-decorator";

import { logger, topology, topologyPeers, grpc, types } from "orbs-common-library";

import { VirtualMachine } from "orbs-virtual-machine-library";

export default class VirtualMachineService {
  private storage = topologyPeers(topology.peers).storage;
  private processor: HardCodedSmartContractProcessor;
}
