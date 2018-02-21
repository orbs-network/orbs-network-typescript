import { FooBarAccount } from "./foobar-contract";

export default function chaiBarsPlugin(_chai: any, utils: any) {
  async function assertFooBarAccountBalance(n: number) {
    // make sure we are working with am Account model
    new _chai.Assertion(this._obj).to.be.instanceof(FooBarAccount);

    const account = <FooBarAccount>this._obj;

    const actualBars = await account.getBalance();

    this.assert(
      actualBars === n
      , "expected #{this} to have balance #{exp} but got #{act}"
      , "expected #{this} to not have balance #{act}"
      , n
      , actualBars
    );
  }

  _chai.Assertion.addMethod("bars", assertFooBarAccountBalance);
}