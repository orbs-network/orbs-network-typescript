export type StartupTestStatus = { status: string; };

export interface StartupTest {
    startupTest(): Promise<StartupTestStatus>;
}