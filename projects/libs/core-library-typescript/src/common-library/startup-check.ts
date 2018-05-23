import { StartupStatus } from "./startup-status";

export interface StartupCheck {
  startupCheck(): Promise<StartupStatus>;
}
