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
      const {app, services} = r;

      const promises: any[] = map(services, (s: Service, key: string) => s.stop());
      promises.push(app.close());

      return promises;
    }));
  }
}
