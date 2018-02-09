export const path: string;

export function ecdh(publicKey: any, privateKey: any): any;

export function ecdhUnsafe(publicKey: any, privateKey: any, compressed?: boolean): any;

export function privateKeyExport(privateKey: any, compressed?: boolean): any;

export function privateKeyImport(privateKey: any): any;

export function privateKeyModInverse(privateKey: any): any;

export function privateKeyNegate(privateKey: any): any;

export function privateKeyTweakAdd(privateKey: any, tweak: number): any;

export function privateKeyTweakMul(privateKey: any, tweak: number): any;

export function privateKeyVerify(privateKey: any): any;

export function publicKeyCombine(publicKeys: any, compressed?: boolean): any;

export function publicKeyConvert(publicKey: any, compressed?: boolean): any;

export function publicKeyCreate(privateKey: any, compressed?: boolean): any;

export function publicKeyTweakAdd(publicKey: any, tweak: number, compressed?: boolean): any;

export function publicKeyTweakMul(publicKey: any, tweak: number, compressed?: boolean): any;

export function publicKeyVerify(publicKey: any): any;

export function recover(message: any, signature: any, recovery: any, compressed?: boolean): any;

export function sign(message: any, privateKey: any, noncefn?: any, data?: any): any;

export function signatureExport(signature: any): any;

export function signatureImport(sig: any): any;

export function signatureImportLax(sig: any): any;

export function signatureNormalize(signature: any): any;

export function verify(message: any, signature: any, publicKey: any): any;

export namespace ecdh {
    const prototype: {
    };

}

export namespace ecdhUnsafe {
    const prototype: {
    };

}

export namespace privateKeyExport {
    const prototype: {
    };

}

export namespace privateKeyImport {
    const prototype: {
    };

}

export namespace privateKeyModInverse {
    const prototype: {
    };

}

export namespace privateKeyNegate {
    const prototype: {
    };

}

export namespace privateKeyTweakAdd {
    const prototype: {
    };

}

export namespace privateKeyTweakMul {
    const prototype: {
    };

}

export namespace privateKeyVerify {
    const prototype: {
    };

}

export namespace publicKeyCombine {
    const prototype: {
    };

}

export namespace publicKeyConvert {
    const prototype: {
    };

}

export namespace publicKeyCreate {
    const prototype: {
    };

}

export namespace publicKeyTweakAdd {
    const prototype: {
    };

}

export namespace publicKeyTweakMul {
    const prototype: {
    };

}

export namespace publicKeyVerify {
    const prototype: {
    };

}

export namespace recover {
    const prototype: {
    };

}

export namespace sign {
    const prototype: {
    };

}

export namespace signatureExport {
    const prototype: {
    };

}

export namespace signatureImport {
    const prototype: {
    };

}

export namespace signatureImportLax {
    const prototype: {
    };

}

export namespace signatureNormalize {
    const prototype: {
    };

}

export namespace verify {
    const prototype: {
    };

}

