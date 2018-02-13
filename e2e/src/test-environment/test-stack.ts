import TestComponent from "./test-component";

export default class TestStack implements TestComponent {
    protected componentStack: TestComponent[] = [];

    protected async startComponent(component: TestComponent) {
        await component.start();
        this.componentStack.push(component);
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