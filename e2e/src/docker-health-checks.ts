import { exec } from "shelljs";
import * as path from "path";

export class DockerHealthChecks {

  static runDockerHealthCheck(maxRetries: number, intervalSec: number) {

    const DOCKER_HEALTH_CHECK_PATH = path.resolve(path.join(__dirname, ".."));

    console.log(`Running docker health check... ${DOCKER_HEALTH_CHECK_PATH}`);
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
}
