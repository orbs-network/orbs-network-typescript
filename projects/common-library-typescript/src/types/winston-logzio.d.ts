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
