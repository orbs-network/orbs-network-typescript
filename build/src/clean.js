const path = require("path");
const shell = require("shelljs");

async function main() {
  console.log("\033[1;32m * Cleaning all sub projects\n\033[0m");
  shell.rm("-rf", path.resolve(__dirname, "../../projects/*"));
}

main();
