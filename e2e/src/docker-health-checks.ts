import { exec } from "shelljs";
import * as path from "path";
import * as _ from "lodash";

export function runDockerHealthCheckShellScript(maxRetries: number, intervalSec: number) {

  const DOCKER_HEALTH_CHECK_PATH = path.resolve(path.join(__dirname, ".."));

  console.log(`Running docker health check script: ${DOCKER_HEALTH_CHECK_PATH} ...`);
  return new Promise((resolve, reject) => {
    exec(`./docker-containers-health-check.sh ${maxRetries} ${intervalSec}`, {
      async: true,
      cwd: DOCKER_HEALTH_CHECK_PATH
    }, (code: any, stdout: any, stderr: any) => {
      if (code == 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });
  });
}

export async function runDockerHealthCheck(maxRetries: number = 12, intervalSec: number = 5) {
  console.log(`Running docker health check maxRetries=${maxRetries} intervalSec=${intervalSec}...`);

  let unhealthyContainers: string[] = [];
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    unhealthyContainers = await runDockerHealthCheckOnce();
    if (unhealthyContainers.length === 0) {
      console.log(`All nodes are healthy`);
      break;
    } else {
      console.log(`Attempt #${attempt + 1} of ${maxRetries}: Found ${unhealthyContainers.length} containers not marked as healthy, retrying in ${intervalSec} seconds. They are:`);
      _.forEach(unhealthyContainers, c => { console.log(`#${attempt}: ${c}`); });
    }
    await sleep(intervalSec * 1000);
  }

  if (unhealthyContainers.length > 0) {
    console.log("Still have unhealthy nodes:");
    _.map(unhealthyContainers, console.log);
  }

  return unhealthyContainers;
}

function runDockerHealthCheckOnce(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec(`docker ps`, {
      async: true,
      silent: true,
      cwd: "."
    }, (code: any, stdout: any, stderr: any) => {
      if (code == 0) {
        const orbsTestNodeLines: string[] = _.filter(stdout.split("\n"), s => s.indexOf("orbs-test-node") > -1);
        // We collect the negative (unhealthy) case so we can print the offending containers to assist debugging
        const unhealthyOrbsTestNodeLines = _.filter(orbsTestNodeLines, isUnhealthyDockerContainerLine);
        resolve(unhealthyOrbsTestNodeLines);
      } else {
        reject(stderr);
      }
    });
  });
}

function isUnhealthyDockerContainerLine(dockerPsLine: string): boolean {
  return dockerPsLine && dockerPsLine.indexOf("(healthy)") === -1;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
