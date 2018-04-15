export function generateServiceIPCClient<T>(service: any): T {
  const client = {};

  for (const propertyName of Object.getOwnPropertyNames(Object.getPrototypeOf(service))) {
    Object.defineProperty(client, propertyName, {
      value: async function (req: any) {
        const ctx = { req, res: {} };
        await service[propertyName](ctx);
        return ctx.res;
      },
      enumerable: true
    });
  }

  return <T>client;
}
