/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import bind from "bind-decorator";

import { logger, grpc, types } from "../common-library";

export interface RPCMethodOptions {
  log: boolean;
}

export interface ServiceConfig {
  nodeName: string;
}

export abstract class Service {
  public config: ServiceConfig;
  public name: string;

  protected static RPCMethod(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>,
    silent: boolean = false): any {
    if (!descriptor || (typeof descriptor.value !== "function")) {
      throw new TypeError(`Only methods can be decorated with @RPCMethod. <${propertyKey}> is not a method!`);
    }

    if (!silent) {
      const originalMethod = descriptor.value;
      descriptor.value = function (rpc: any) {
        logger.debug(`${this.config.nodeName}: ${propertyKey} ${JSON.stringify(rpc.req)}`);

        return originalMethod.apply(this, [rpc]);
      };
    }

    return bind(target, propertyKey, descriptor);
  }

  protected static SilentRPCMethod(target: Object, propertyKey: string,
    descriptor: TypedPropertyDescriptor<Function>): any {
    return Service.RPCMethod(target, propertyKey, descriptor, true);
  }

  public constructor(config: ServiceConfig) {
    this.name = this.constructor.name;
    this.config = config;
  }

  abstract async initialize(): Promise<void>;

  public async start() {
    await this.initialize();

    logger.info(`${this.config.nodeName} (${this.name}): service started`);
  }

  abstract async shutdown(): Promise<void>;

  public async stop() {
    await this.shutdown();

    logger.info(`${this.config.nodeName} (${this.name}): service shut down`);
  }

  public static initLogger(fileName: string) {
    const { LOGZIO_API_KEY, LOG_LEVEL } = process.env;

    logger.configure({
      level: LOG_LEVEL,
      file: {
        fileName
      },
      logzio: {
        apiKey: LOGZIO_API_KEY
      },
      console: true
    });
  }
}
