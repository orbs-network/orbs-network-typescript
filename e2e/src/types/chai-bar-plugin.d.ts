declare module 'chai' {
    global {
        export namespace Chai {
            interface Assertion {
                bars(n: number): Promise<void>;
            }
        }
    }
}