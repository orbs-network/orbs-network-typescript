import bind from "bind-decorator";

export class Service {
  protected static RPCMethod<T extends Function>(target: object, propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void {
    if (!descriptor || (typeof descriptor.value !== "function")) {
      throw new TypeError(`Only methods can be decorated with @RPCMethod. <${propertyKey}> is not a method!`);
    }

    return bind(target, propertyKey, descriptor);
  }
}
