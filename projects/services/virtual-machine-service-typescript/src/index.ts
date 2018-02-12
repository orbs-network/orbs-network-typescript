import { ErrorHandler, grpc } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import VirtualMachineService from "./service";

ErrorHandler.setup();

const server = grpc.virtualMachineServer({
  endpoint: topology.endpoint,
  service: new VirtualMachineService()
});
