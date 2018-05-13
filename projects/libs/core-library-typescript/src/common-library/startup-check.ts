import { StartupCheckResult } from "./startup-check-result";

export interface StartupCheck {
  startupCheck(): Promise<StartupCheckResult>;
}
