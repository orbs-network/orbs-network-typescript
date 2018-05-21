export interface StartupStatus {
  name: string;
  status: STARTUP_STATUS;
  childStartupStatuses?: StartupStatus[];
  message?: string;
}

export enum STARTUP_STATUS { OK, FAIL, PARTIALLY_OPERATIONAL }
