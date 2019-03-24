/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as winston from 'winston';
import { TransportInstance } from 'winston';

export interface WinstonLogzioTransportOptions {
  apiKey: string;
  host: string;
}

export interface WinstonLogzioTransportInstance extends TransportInstance {
  new(options?: WinstonLogzioTransportOptions): WinstonLogzioTransportInstance;
}

export declare class Logzio extends winston.Transport implements WinstonLogzioTransportInstance {
  constructor(options?: WinstonLogzioTransportOptions);
}

declare module "winston" {
  interface Transports {
    Logzio: Logzio;
  }
}
