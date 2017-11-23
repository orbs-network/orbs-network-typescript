const path = require("path");
const shell = require("shelljs");
require("colors");

async function main() {
  console.log("* Cleaning all sub projects\n".green);
  shell.rm("-rf", path.resolve(__dirname, "../../projects/*"));
}

main();
