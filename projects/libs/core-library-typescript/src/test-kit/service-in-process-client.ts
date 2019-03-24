/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

export function generateServiceInProcessClient<T>(service: any): T {
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
