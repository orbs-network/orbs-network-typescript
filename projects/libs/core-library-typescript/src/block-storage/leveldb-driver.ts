import * as path from "path";
import * as mkdirp from "mkdirp";
import * as levelup from "levelup";
import leveldown from "leveldown";

export class LevelDBDriver {

  private db: levelup.LevelUp;

  public constructor(dbPath: string) {
    // Make sure that the DB directory exists.
    const directory = path.dirname(dbPath);
    mkdirp.sync(directory);

    // Open/create the blocks LevelDB database.
    this.db = levelup.default(leveldown(dbPath));
  }

  public get<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(key, (error: any, value: any) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(value);
      });
    });
  }

  public put<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.put(key, value, (error: any) => {
        if (error) {
          reject(error);

          return;
        }

        resolve();
      });
    });
  }

  public async close(): Promise<void> {
    return this.db.close();
  }
}
