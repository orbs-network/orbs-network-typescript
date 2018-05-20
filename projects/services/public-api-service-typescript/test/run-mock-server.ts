import createMockServer from "./mock-server";
import * as args from "args";

args
  .option("port", "HTTP Port to listen on")
  .option("stubs", "JSON representing RequestStub[]");

const flags = args.parse(process.argv);

if (flags.port && flags.stubs) {

  createMockServer(JSON.parse(flags.stubs))
    .then(server => server.listen(flags.port, () => console.log(`started on port ${flags.port}`)))
    .catch(error => console.log(`server failed to start, got error: ${error}`));

} else {
  console.log(args.showHelp());
}

