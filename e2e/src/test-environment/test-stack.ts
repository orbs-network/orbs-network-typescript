/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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