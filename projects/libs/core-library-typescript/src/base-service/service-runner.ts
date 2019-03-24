/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { Service } from "./service";
import { map, flatMap } from "lodash";
import { GRPCRuntime } from "..";

export class ServiceRunner {
  public static async run(grpcServerFunc: any, service: Service, endpoint: string): Promise<GRPCRuntime> {
    await service.start();

    return grpcServerFunc({
      endpoint,
      service
    });
  }

  public static async runMulti(grpcServerFunc: any, services: Service[], endpoint: string): Promise<GRPCRuntime> {
    for (const service of services) {
      await service.start();
    }

    return grpcServerFunc({ endpoint, services });
  }

  public static async stop(...runtime: GRPCRuntime[]) {
    return Promise.all(flatMap(runtime, (r) => {
      const { app, services } = r;

      const promises: any[] = map(services, (s: Service, key: string) => s.stop());
      promises.push(app.close());

      return promises;
    }));
  }
}
