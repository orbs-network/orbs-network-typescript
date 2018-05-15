export interface StartupStatus {
  name: string;
  status: STARTUP_STATUS;
  childStartupStatuses?: StartupStatus[];
  message?: string;
}

// export interface CompositeStartupStatus {
//   status: STARTUP_STATUS;
//   startupStatuses?: StartupStatus[];
//   message?: string;
// }

export enum STARTUP_STATUS { OK, FAIL, PARTIALLY_OPERATIONAL }
