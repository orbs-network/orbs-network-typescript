#!/usr/bin/env python

import unittest
from pycrypto import ED25519Key


class TestED25519Key(unittest.TestCase):
    def test_initialized_by_a_public_key(self):
        public_key1 = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"

        key1 = ED25519Key(public_key1)
        self.assertEqual(key1.public_key, public_key1)
        self.assertFalse(key1.has_private_key)

        public_key2 = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"
        key2 = ED25519Key(public_key2)
        self.assertEqual(key2.public_key, public_key2)
        self.assertFalse(key2.has_private_key)

    def test_initialized_by_a_public_key_and_private_key(self):
        public_key1 = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
        private_key1 = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"

        key1 = ED25519Key(public_key1, private_key1)
        self.assertEqual(key1.public_key, public_key1)
        self.assertEqual(key1.unsafe_private_key, private_key1)
        self.assertTrue(key1.has_private_key)

        public_key2 = "f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"
        private_key2 = "031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"

        key2 = ED25519Key(public_key2, private_key2)
        self.assertEqual(key2.public_key, public_key2)
        self.assertEqual(key2.unsafe_private_key, private_key2)
        self.assertTrue(key2.has_private_key)

    def test_is_randomly_generated(self):
        key1 = ED25519Key()
        key2 = ED25519Key()
        key3 = ED25519Key()

        self.assertEqual(len(key1.public_key), 64)
        self.assertEqual(len(key1.unsafe_private_key), 64)
        self.assertTrue(key1.has_private_key)

        self.assertEqual(len(key2.public_key), 64)
        self.assertEqual(len(key2.unsafe_private_key), 64)
        self.assertTrue(key2.has_private_key)

        self.assertEqual(len(key3.public_key), 64)
        self.assertEqual(len(key3.unsafe_private_key), 64)
        self.assertTrue(key3.has_private_key)

        self.assertNotEqual(key1.public_key, key2.public_key)
        self.assertNotEqual(key2.public_key, key3.public_key)


if __name__ == '__main__':
    unittest.main()

#   it("is randomly generated", async ()=> {
#       const key1=new ED25519Key()
#       const key2=new ED25519Key()
#       const key3=new ED25519Key()

#       expect(key1.publicKey).to.have.length(64)
#       expect(key1.hasPrivateKey).to.equal(true)
#       expect(key2.publicKey).to.have.length(64)
#       expect(key2.hasPrivateKey).to.equal(true)
#       expect(key3.publicKey).to.have.length(64)
#       expect(key3.hasPrivateKey).to.equal(true)

#       expect(key1.publicKey).not.to.be.equal(key2.publicKey)
#       expect(key2.publicKey).not.to.be.equal(key3.publicKey)
#   })

#   it("can sign and verify messages", async ()=> {
#       const message1=Buffer.from("Hello World!")
#       const publicKey1="b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
#       const privateKey1="3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"
#       const key1=new ED25519Key(publicKey1, privateKey1)
#       const signature1=key1.sign(message1)
#       expect(key1.verify(message1, signature1)).to.be.true

#       const message2=Buffer.from("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean - Paul Sartre, Nobel Prize winner.")
#       const publicKey2="f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"
#       const privateKey2="031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"
#       const key2=new ED25519Key(publicKey2, privateKey2)
#       const signature2=key2.sign(message2)
#       expect(key2.verify(message2, signature2)).to.be.true

#       expect(key1.verify(message2, signature1)).to.be.false
#       expect(key1.verify(message1, signature2)).to.be.false
#       expect(key1.verify(message2, signature2)).to.be.false
#       expect(key2.verify(message2, signature1)).to.be.false
#       expect(key2.verify(message1, signature2)).to.be.false
#       expect(key2.verify(message1, signature1)).to.be.false
#   })

#   it("can sign messages which can be verified externally", async ()=> {
#       const ec=new eddsa("ed25519")

#       const message1=Buffer.from("Hello World!")
#       const publicKey1="b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
#       const privateKey1="3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"
#       const key1=new ED25519Key(publicKey1, privateKey1)
#       const signature1: Buffer=key1.sign(message1)

#       const ecKey1=ec.keyFromPublic(publicKey1)
#       expect(ecKey1.verify([...message1], [...signature1])).to.be.true

#       const message2=Buffer.from("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean - Paul Sartre, Nobel Prize winner.")
#       const publicKey2="f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"
#       const privateKey2="031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"
#       const key2=new ED25519Key(publicKey2, privateKey2)
#       const signature2: Buffer=key2.sign(message2)

#       const ecKey2=ec.keyFromPublic(publicKey2)
#       expect(ecKey2.verify([...message2], [...signature2])).to.be.true
#   })

#   it("can verify externally signed messages", async ()=> {
#       const ec=new eddsa("ed25519")

#       const message1=Buffer.from("Hello World!")
#       const publicKey1="b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
#       const privateKey1="3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"

#       const ecKey1=ec.keyFromSecret(privateKey1)
#       const ecSignature1=Buffer.from(ecKey1.sign([...message1]).toBytes())

#       const key1=new ED25519Key(publicKey1)
#       expect(key1.verify(message1, ecSignature1)).to.be.true

#       const message2=Buffer.from("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean - Paul Sartre, Nobel Prize winner.")
#       const publicKey2="f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"
#       const privateKey2="031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"

#       const ecKey2=ec.keyFromSecret(privateKey2)
#       const ecSignature2=Buffer.from(ecKey2.sign([...message2]).toBytes())

#       const key2=new ED25519Key(publicKey2)
#       expect(key2.verify(message2, ecSignature2)).to.be.true
#   })
