const path = require("path");
const shell = require("shelljs");
const projects = require("../../config/projects.json");
require("colors");

async function main() {
  for (const projectName in projects) {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, "../../projects/", projectName);
    if (project.runtime === "typescript" || project.runtime === "protobuf") {
      console.log(`* Building ${projectName}\n`.green);
      shell.cd(project.path);
      var shellStringOutput = shell.exec("./build.sh");
      if (shellStringOutput.code !== 0)  {
        console.error(`Error ${shellStringOutput.code} in ${project.path}\n`.red);
        return;
      };
    }
  }
  console.log(" * Done\n".green);
}

main();
