import { Service } from "./service";

export class ServiceRunner {
  public static async run(grpcServerFunc: any, service: Service): Promise<void> {
    await service.start();

    return grpcServerFunc({
      endpoint: service.nodeTopology.endpoint,
      service
    });
  }

  public static async runMulti(grpcServerFunc: any, services: Service[]): Promise<void> {
    const endpoint = services[0].nodeTopology.endpoint;

    for (const service of services) {
      const serviceEndpoint = service.nodeTopology.endpoint;
      if (endpoint !== serviceEndpoint) {
        throw new Error(`Multi-services should run on the same endpoint! Expected: ${endpoint}, received: ${serviceEndpoint}`);
      }

      await service.start();
    }

    return grpcServerFunc({ endpoint, services });
  }
}
