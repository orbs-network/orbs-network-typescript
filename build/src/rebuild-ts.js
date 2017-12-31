const path = require('path');
const shell = require('shelljs');
const projects = require('../../config/projects.json');
const fs = require('fs');
require('colors');

const srcDirs = {
  typescript: 'src',
  protobuf: 'interfaces',
};

function changeTime(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    return fs.readdirSync(filePath).reduce((p, fileName) => Math.max(p, changeTime(`${filePath}/${fileName}`)), stat.mtime);
  }

  return stat.mtime;
}

async function main() {
  Object.keys(projects).forEach((projectName) => {
    const project = projects[projectName];
    const projectPath = path.resolve(__dirname, '../../projects/', projectName);
    if (changeTime(`${projectPath}/${srcDirs[project.runtime]}`) <= changeTime(`${projectPath}/dist`)) {
      return;
    }

    if (project.runtime === 'typescript' || project.runtime === 'protobuf') {
      console.log(` * Rebuilding ${projectName}\n`.green);

      shell.cd(projectPath);
      const shellStringOutput = shell.exec('./rebuild.sh');
      if (shellStringOutput.code !== 0) {
        console.error(`Error ${shellStringOutput.code} in ${projectPath}\n`.red);
      }
    }
  });

  console.log(' * Done\n'.green);
}

main();
