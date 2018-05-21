export interface StartupStatus {
  name: string;
  status: STARTUP_STATUS;
  services?: StartupStatus[];
  message?: string;
}

export enum STARTUP_STATUS { OK = "OK", FAIL = "FAIL", PARTIALLY_OPERATIONAL = "PARTIALLY_OPERATIONAL" }
