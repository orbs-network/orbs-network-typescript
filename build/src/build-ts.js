/* eslint-disable no-console */

const path = require('path');
const shell = require('shelljs');
const projects = require('../../config/projects.json');
require('colors');

const RUNTIMES = ['typescript', 'protobuf', 'c++', 'java'];

async function main() {
  projects.order.forEach((projectName) => {
    const project = projects[projectName];

    if (RUNTIMES.indexOf(project.runtime) === -1) {
      return;
    }

    const projectPath = path.resolve(__dirname, '../../', project.path);

    console.log(`* Building ${projectName}\n`.green);
    shell.cd(projectPath);

    const shellStringOutput = shell.exec(project.runtime !== 'c++' ? './build.sh' : './rebuild.sh');
    if (shellStringOutput.code !== 0) {
      throw new Error(`Error ${shellStringOutput.code} in ${projectPath}\n`.red);
    }
  });

  console.log(' * Done\n'.green);
}

main().catch((e) => {
  console.error(e);

  process.exit(1);
});
