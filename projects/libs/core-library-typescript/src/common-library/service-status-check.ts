import { ServiceStatus } from "./startup-check-result";

export interface ServiceStatusChecker {
  checkServiceStatus(): Promise<ServiceStatus>;
}
