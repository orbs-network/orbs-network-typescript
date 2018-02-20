import { Service } from "./service";

export class ServiceRunner {
  public static async run(grpcServerFunc: any, service: Service, endpoint: string): Promise<void> {
    await service.start();

    return grpcServerFunc({
      endpoint,
      service
    });
  }

  public static async runMulti(grpcServerFunc: any, services: Service[], endpoint: string): Promise<void> {
    for (const service of services) {
      await service.start();
    }

    return grpcServerFunc({ endpoint, services });
  }
}
