const path = require("path");
const shell = require("shelljs");
const projects = require("../../config/projects.json");
require("colors");

async function main() {
  for (const projectName in projects) {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, "../../projects/", projectName);
    if (project.runtime === "typescript") {
      console.log(`* Building ${projectName}\n`.green);
      shell.cd(project.path);
      shell.exec("./build.sh");
    }
  }
  console.log(" * Done\n".green);
}

main();
