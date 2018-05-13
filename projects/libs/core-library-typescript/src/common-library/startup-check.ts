import { StartupCheckResult } from "./startup-check-result";

export interface StartupChecker {
  startupCheck(): Promise<StartupCheckResult>;
}
