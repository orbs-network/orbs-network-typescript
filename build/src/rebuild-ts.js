const path = require("path");
const shell = require("shelljs");
const projects = require("../../config/projects.json");
const fs = require("fs");
require("colors");

const srcDirs = {
  "typescript": "src",
  "protobuf": "interfaces"
}

function changeTime(path) {
  const stat = fs.statSync(path);
  if (stat.isDirectory()) {
    return fs.readdirSync(path).reduce(function(p, fileName) {
      return Math.max(p, changeTime(path + "/" + fileName));
    }, stat.mtime);
  }
  return stat.mtime;
}

async function main() {
  for (const projectName in projects) {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, "../../projects/", projectName);
    if (changeTime(`${project.path}/${srcDirs[project.runtime]}`) <= changeTime(`${project.path}/dist`)) {
      continue;
    }
    if (project.runtime === "typescript" || project.runtime === "protobuf") {
      console.log(` * Rebuilding ${projectName}\n`.green);

      shell.cd(project.path);
      var shellStringOutput = shell.exec("./rebuild.sh");
      if (shellStringOutput.code !== 0)  {
        console.error(`Error ${shellStringOutput.code} in ${project.path}\n`.red);
        return;
      };
    }
  }
  console.log(" * Done\n".green);
}

main();
