import { ErrorHandler, grpc, ServiceRunner } from "orbs-core-library";

import VirtualMachineService from "./service";

ErrorHandler.setup();

const main = async () => {
  await ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService());
};

main();
