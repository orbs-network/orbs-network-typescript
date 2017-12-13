import * as fs from "fs";

function showUsage() {
  console.log(`Usage: node dist/index.js <topology-path>`);
  console.log();
}

if (!process.argv[2]) {
  console.log(`ERROR: topology not provided, exiting`);
  showUsage();
  process.exit();
}

const filePath = process.argv[2];
if (!fs.existsSync(filePath)) {
  console.log(`ERROR: topology with path '${filePath}' not found, exiting`);
  showUsage();
  process.exit();
}

export const topology = require(filePath);
