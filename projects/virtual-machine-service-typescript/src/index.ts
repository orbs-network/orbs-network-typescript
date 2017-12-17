import { topology, grpc } from "orbs-common-library";
import VirtualMachineService from "./service";

const server = grpc.virtualMachineServer({
  endpoint: topology.endpoint,
  service: new VirtualMachineService()
});
