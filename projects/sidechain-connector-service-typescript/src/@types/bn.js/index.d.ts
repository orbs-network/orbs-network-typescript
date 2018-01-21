declare module "bn.js" {
    import { Buffer } from "buffer";

    type Endianness = "le"| "be";

    export class BigNumber {
        constructor(number: number|string|number[]|Buffer, base?: number, endian?: Endianness);
        clone(): BigNumber;
        toString(base?: number, length?: number): string;
        toNumber(): number;
        toJSON(): string;
        toArray(endian?: Endianness, length?: number): number[];
        toBuffer(endian?: Endianness, length?: number): Buffer;
        bitLength(): number;
        zeroBits(): number;
        byteLength(): number;
        isNeg(): boolean;
        isEven(): boolean;
        isOdd(): boolean;
        isZero(): boolean;
        cmp(b: any): number;
        lt(b: any): boolean;
        lte(b: any): boolean;
        gt(b: any): boolean;
        gte(b: any): boolean;
        eq(b: any): boolean;
        isBigNumber(b: any): boolean;

        neg(): BigNumber;
        abs(): BigNumber;
        add(b: BigNumber): BigNumber;
        sub(b: BigNumber): BigNumber;
        mul(b: BigNumber): BigNumber;
        sqr(): BigNumber;
        pow(b: BigNumber): BigNumber;
        div(b: BigNumber): BigNumber;
        mod(b: BigNumber): BigNumber;
        divRound(b: BigNumber): BigNumber;

        or(b: BigNumber): BigNumber;
        and(b: BigNumber): BigNumber;
        xor(b: BigNumber): BigNumber;
        setn(b: number): BigNumber;
        shln(b: number): BigNumber;
        shrn(b: number): BigNumber;
        testn(b: number): boolean;
        maskn(b: number): BigNumber;
        bincn(b: number): BigNumber;
        notn(w: number): BigNumber;

        gcd(b: BigNumber): BigNumber;
        egcd(b: BigNumber): { a: BigNumber, b: BigNumber, gcd: BigNumber };
        invm(b: BigNumber): BigNumber;
    }
}