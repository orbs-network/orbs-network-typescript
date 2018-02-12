import * as shell from "shelljs";
import TestComponent from "./test-component";

export default class TestNetwork implements TestComponent {
    name: string;
    subnet: string;
    lastAddressIndex: number = 1;

    constructor(name: string, subnet: string) {
        this.name = name;
        this.subnet = subnet;
    }

    public async start(): Promise<void> {
        await this.stop();
        const res = shell.exec(`docker network create ${this.name} --subnet ${this.subnet}.0/24`);
        if (res.code != 0 ) {
            throw `${this.name}: ${res.stderr}`;
        }
    }

    public async stop(): Promise<void> {
        shell.exec(`docker network rm ${this.name}`);
        this.lastAddressIndex = 1;
    }

    public allocateAddress() {
        return `${this.subnet}.${++this.lastAddressIndex}`;
    }
}