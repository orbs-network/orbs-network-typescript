/// <reference types="node" />

import { TransportInstance, Transports, TransportOptions } from "winston";
import { WinstonLogzIoTransport } from "winston-logzio";

declare module "winston" {
  export interface Transports extends WinstonLogzIoTransport { }
}

declare module "winston-logzio" {
  export interface WintstonLogzIoTransportInstance extends TransportInstance {
  }

  export interface WinstonLogzIoTransport {
    Logzio: WintstonLogzIoTransportInstance;
  }
}
