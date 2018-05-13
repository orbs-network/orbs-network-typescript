export type StartupCheckResult = {
  status: STARTUP_CHECK_STATUS;
  serviceName?: string;
  message?: string;
};

export enum STARTUP_CHECK_STATUS { OK, FAIL }
