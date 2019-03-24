/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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

    const projectPath = path.resolve(__dirname, '../../', project.path);

    console.log(` * Watching ${projectName}\n`.green);
    shell.cd(projectPath);
    shell.exec('./watch.sh', { async: true });
  });
}

main().catch((e) => {
  console.error(e);

  process.exit(1);
});

