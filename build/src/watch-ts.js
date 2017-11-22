const path = require("path");
const shell = require("shelljs");
const projects = require("../../config/projects.json");

async function main() {
  for (const projectName in projects) {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, "../../projects/", projectName);
    if (project.runtime === "typescript") {
      console.log("\033[1;32m * Watching " + projectName + "\n\033[0m");
      shell.cd(project.path);
      shell.exec("./watch.sh", {async: true});
    }
  }
}

main();
