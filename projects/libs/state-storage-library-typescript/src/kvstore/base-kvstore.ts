export default abstract class BaseKVStore {

    public async get(contractAddress: string, key: string): Promise<string> {
        throw "Not yet implemented";
    }

    public async getMany(contractAddress: string, keys: string[]): Promise<Map<string, string>> {
        throw "Not yet implemented";
    }

    public async set(contractAddress: string, key: string, value: string) {
        throw "Not yet implemented";
    }

    public async setMany(contractAddress: string, values: Map<string, string>) {
        throw "Not yet implemented";
    }
}
