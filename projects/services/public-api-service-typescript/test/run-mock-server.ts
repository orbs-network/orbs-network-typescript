import createMockServer from "./mock-server";
import * as args from "args";

args
  .option("port", "HTTP Port to listen on")
  .option("stubs", "JSON representing RequestStub[]");

const flags = args.parse(process.argv);

if (flags.port && flags.stubs) {
  console.log(`Starting mock http server on port ${flags.port}`);
  createMockServer(JSON.parse(flags.stubs)).listen(flags.port, () => process.send("started"));
} else {
  console.log(args.showHelp());
}

