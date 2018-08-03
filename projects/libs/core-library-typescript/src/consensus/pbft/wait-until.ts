import { logger } from "../../common-library/logger";

export const waitUntil = <T>(pollingInterval: number, predicate: () => Promise<T>, predicateName: string): Promise<T> => {
  return new Promise<T>(resolve => {
    let pollingTime: number = 0;
    const looper = () => {
      predicate().then(val => {
          logger.debug(`waitUntil with predicate ${predicateName}, got value ${JSON.stringify(val)} on pollingTime ${pollingTime}`);
          if (val === undefined || val === null) {
            pollingTime += pollingInterval;
            setTimeout(looper, pollingInterval);
          } else {
            resolve(val);
          }
      });
    };
    looper();
  });
};

