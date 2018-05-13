export interface ServiceStatus {
  name: string;
  status: STARTUP_CHECK_STATUS;
  message?: string;
}

export interface StartupCheckResult {
  status: STARTUP_CHECK_STATUS;
  services?: ServiceStatus[];
  message?: string;
}

export enum STARTUP_CHECK_STATUS { OK, FAIL, PARTIALLY_OPERATIONAL }
