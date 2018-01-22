const path = require('path');
const shell = require('shelljs');
const projects = require('../../config/projects.json');
require('colors');

async function main() {
  projects.order.forEach((projectName) => {
    const project = projects[projectName];
    const projectPath = path.resolve(__dirname, '../../projects/', projectName);
    if (project.runtime === 'typescript' || project.runtime === 'protobuf') {
      console.log(`* Building ${projectName}\n`.green);
      shell.cd(projectPath);
      const shellStringOutput = shell.exec('./build.sh');
      if (shellStringOutput.code !== 0) {
        console.error(`Error ${shellStringOutput.code} in ${projectPath}\n`.red);
      }
    }
  });

  console.log(' * Done\n'.green);
}

main();
