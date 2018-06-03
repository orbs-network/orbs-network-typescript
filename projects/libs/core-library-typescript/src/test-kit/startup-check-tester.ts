import { StartupStatus, STARTUP_STATUS } from "../common-library/startup-status";
import * as _ from "lodash";
import * as request from "supertest";

export function testStartupCheckHappyPath(serverIpAddress: string, port: number, componentName: string, childServiceNames?: string[], ) {
  const expected: StartupStatus = {
    name: componentName,
    status: STARTUP_STATUS.OK,
  };
  if (childServiceNames && childServiceNames.length > 0) {
    expected.services = _.map(childServiceNames, name => { return { name, status: STARTUP_STATUS.OK }; });
  }

  return request(`http://${serverIpAddress}:${port}`)
    .get("/admin/startupCheck")
    .expect(200, expected);
}

