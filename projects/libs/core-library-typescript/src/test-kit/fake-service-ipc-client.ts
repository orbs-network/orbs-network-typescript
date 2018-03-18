export function generateFakeServiceIPCClient<T>(service: any): T {
  const client = {};

  for (const propertyName of Object.getOwnPropertyNames(Object.getPrototypeOf(service))) {
    Object.defineProperty(client, propertyName, {
      value: async function (req: any) {
        const ctx = { req, res: {} };
        await service[propertyName](ctx);
        //   console.log(`called ${propertyName} with ${JSON.stringify(req)}. result: ${JSON.stringify(ctx.res)}`);
        return ctx.res;
      },
      enumerable: true
    });
  }

  return <T>client;
}
