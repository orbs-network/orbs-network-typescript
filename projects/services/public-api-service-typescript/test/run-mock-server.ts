import createMockServer from "./mock-server";
import * as args from "args";

args
  .option("port", "HTTP Port to listen on")
  .option("stubs", "JSON representing RequestStub[]");

const flags = args.parse(process.argv);

if (flags.port && flags.stubs) {

  createMockServer(JSON.parse(flags.stubs)).listen(flags.port, () => console.log(`started on port ${flags.port}`));
} else {
  console.log(args.showHelp());
}

