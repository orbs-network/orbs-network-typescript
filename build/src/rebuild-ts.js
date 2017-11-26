const path = require("path");
const shell = require("shelljs");
const projects = require("../../config/projects.json");
require("colors");

async function main() {
  for (const projectName in projects) {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, "../../projects/", projectName);
    if (project.runtime === "typescript" || project.runtime === "protobuf") {
      console.log(` * Rebuilding ${projectName}\n`.green);
      shell.cd(project.path);
      shell.exec("./rebuild.sh");
    }
  }
  console.log(" * Done\n".green);
}

main();
