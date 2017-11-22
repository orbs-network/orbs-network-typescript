const path = require("path");
const shell = require("shelljs");

async function main() {
  shell.rm("-rf", path.resolve(__dirname, "../../projects/*"));
}

main();
