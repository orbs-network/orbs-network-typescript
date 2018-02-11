import { ErrorHandler, topology, grpc } from "orbs-core-library/dist/common-library";

import VirtualMachineService from "./service";

ErrorHandler.setup();

const server = grpc.virtualMachineServer({
  endpoint: topology.endpoint,
  service: new VirtualMachineService()
});
