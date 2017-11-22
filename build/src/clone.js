const path = require("path");
const git = require("nodegit");
const projects = require("../../config/projects.json");

async function main() {
  const promises = [];
  for (const projectName in projects) {
    const project = projects[projectName];
    project.path = path.resolve(__dirname, "../../projects/", projectName);
    promises.push(git.Clone(project.repo, project.path));
  }
  await Promise.all(promises);
}

main();
