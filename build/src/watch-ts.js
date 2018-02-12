/* eslint-disable no-console */

const path = require('path');
const shell = require('shelljs');
const projects = require('../../config/projects.json');
require('colors');

async function main() {
  projects.order.forEach((projectName) => {
    const project = projects[projectName];

    if (project.runtime !== 'typescript') {
      return;
    }

    let dir;
    switch (project.type) {
      case 'static':
        dir = '';
        break;

      case 'library':
        dir = 'libs';
        break;

      case 'service':
        dir = 'services';
        break;

      default:
        throw new Error(`Unsupported project type: ${project.type}`);
    }

    const projectPath = path.resolve(__dirname, '../../projects/', dir, projectName);

    console.log(` * Watching ${projectName}\n`.green);
    shell.cd(projectPath);
    shell.exec('./watch.sh', { async: true });
  });
}

main().catch((e) => {
  console.error(e);

  process.exit(1);
});

