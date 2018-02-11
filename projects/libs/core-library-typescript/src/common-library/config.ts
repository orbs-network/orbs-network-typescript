import * as nconf from "nconf";
import * as path from "path";

export class Config {
  private static readonly NODE_ENV: string = "NODE_ENV";
  private static readonly TEST_ENV: string = "test";
  private static readonly DEV_ENV: string = "development";
  private static readonly PROD_ENV: string = "production";
  private static readonly STAGING_ENV: string = "staging";
  private static readonly RELATIVE_PATH: string = "../../../../config/";
  private static readonly EXT: string = ".json";

  constructor() {
    // Setup nconf to use (in-order):
    //   1. Command-line arguments.
    //   2. Environment variables.
    //   3. A file located at 'config/[ENVIRONMENT].json'
    nconf.argv().env({ separator: "__" }).file(path.resolve(__dirname, Config.RELATIVE_PATH, Config.getEnvironment()) + Config.EXT);
  }

  public get(key: string) {
    return nconf.get(key);
  }

  public isDevelopment(): boolean {
    return Config.getEnvironment() === Config.DEV_ENV;
  }

  public isStaging(): boolean {
    return Config.getEnvironment() === Config.STAGING_ENV;
  }

  public isTest(): boolean {
    return Config.getEnvironment() === Config.TEST_ENV;
  }

  public isProduction(): boolean {
    return Config.getEnvironment() === Config.PROD_ENV;
  }

  public static getEnvironment(): string {
    return nconf.get(Config.NODE_ENV) || process.env[Config.NODE_ENV] || Config.DEV_ENV;
  }

  // This is just a convenience wrapper for getting the environment name directly from an instance of the configuration.
  public getEnvironment(): string {
    return Config.getEnvironment();
  }
}

export const config = new Config();
