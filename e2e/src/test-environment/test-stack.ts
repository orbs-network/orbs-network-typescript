import TestComponent from "./test-component";

export default abstract class TestStack implements TestComponent {
    protected componentStack: TestComponent[] = [];

    protected async startComponent(component: TestComponent) {
        this.componentStack.push(component);
        await component.start();
    }

    async start() {
        throw "not implemented";
    }

    public async stop() {
        while (true) {
            const component = this.componentStack.pop();
            if (!component) {
                break;
            }
            await component.stop();
        }
    }
}