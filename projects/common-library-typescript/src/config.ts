import * as nconf from "nconf";
import * as path from "path";

export class Config {
  private static readonly NODE_ENV: string = "NODE_ENV";
  private static readonly DEV_ENV: string = "development";
  private static readonly RELATIVE_PATH: string = "../../../config/";
  private static readonly EXT: string = ".json";

  constructor() {
    // Setup nconf to use (in-order):
    //   1. Command-line arguments.
    //   2. Environment variables.
    //   3. A file located at 'config/[ENVIRONMENT].json'
    nconf.argv().env().file(path.resolve(__dirname, Config.RELATIVE_PATH, Config.getEnvironment()) + Config.EXT);
  }

  public get(key: string): string {
    return nconf.get(key);
  }

  public static getEnvironment(): string {
    return nconf.get(Config.NODE_ENV) || process.env[Config.NODE_ENV] || Config.DEV_ENV;
  }
}

export const config = new Config();