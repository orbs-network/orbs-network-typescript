const path = require('path');
const shell = require('shelljs');
const projects = require('../../config/projects.json');
require('colors');

async function main() {
  projects.order.forEach((projectName) => {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, '../../projects/', projectName);
    if (project.runtime === 'typescript') {
      console.log(` * Watching ${projectName}\n`.green);
      shell.cd(project.path);
      shell.exec('./watch.sh', { async: true });
    }
  });
}

main();
