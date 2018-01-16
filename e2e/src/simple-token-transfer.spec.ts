// import { expect, should } from 'chai';
const {Assertion, expect} = require('chai');

function assertModelBars (n: number) {
    // make sure we are working with a model
    new Assertion(this._obj).to.be.instanceof(Account);

    // make sure we have an age and its a number
    const actualBars = this._obj.bars;
    new Assertion(actualBars).to.be.a('number');

    this.assert(
        actualBars === n
        , "expected #{this} to have balance #{exp} but got #{act}"
        , "expected #{this} to not have balance #{act}"
        , n
        , actualBars
    );
}

Assertion.addMethod('bars', assertModelBars);

const accounts = new Map<string, Account>();

class Account {
    public bars: number;
    address: string;

    constructor(bars: number, address: string) {
        this.bars = bars;
    }

    send(transaction: {to: string, bars: number}) {
        const otherAccount = accounts.get(transaction.to);

        otherAccount.bars += transaction.bars;
        this.bars -= transaction.bars;

    }

}

function anAccountWith(builder: {bars: number}) {
    const account = new Account(builder.bars, (Math.random() * 10000).toString());
    accounts.set(account.address, account);
    return account;
}

describe("simple token transfer", () => {
    it("transfers 1 token from one account to another", async () => {
        const account1 = await anAccountWith({bars: 2});
        const account2 = await anAccountWith({bars: 0});

        await account1.send({to: account2.address, bars: 1});

        expect(account1).to.have.bars(1);
        expect(account2).to.have.bars(1);
    });
});