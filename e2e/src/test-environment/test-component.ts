export default interface TestComponent {
    start(): Promise<void>;
    stop(): Promise<void>;
}