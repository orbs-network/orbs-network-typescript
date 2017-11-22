const path = require("path");
const shell = require("shelljs");
const projects = require("../../config/projects.json");

async function main() {
  for (const projectName in projects) {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, "../../projects/", projectName);
    if (project.runtime === "typescript") {
      shell.cd(project.path);
      shell.exec("./build.sh");
    }
  }
}

main();
