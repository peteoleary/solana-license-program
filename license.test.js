const web3 = require('@solana/web3.js')
const BN = require('bn.js')

const utils = require('./utils')
const fs = require('fs')
const { expect } = require('@jest/globals')
const { async } = require('regenerator-runtime')

const programId = new web3.PublicKey('91FXCUBpyaMzSb1jBjwUjYxBmUvyPLTqEzKKHvqjtY7V')
const LICENSE_AGREEMENT_SCHEMA_SIZE = 104
const seed = 'agreement_account'

test('it reads key files', async () => {
  var account = utils.getKeypair('license_test')
  expect(account.publicKey.toBase58().length).toBe(44)
  const agreementPublicKey = await getAgreementPublicKey(account)
  expect(agreementPublicKey.toBase58().length).toBe(44)
})

test('it gets a valid connection', async () => {  
    var connection = utils.getConnection()

    var wallet = utils.getKeypair('license_test')

   let account = await utils.airDrop(connection, wallet.publicKey)

    expect(account.lamports).toBeGreaterThanOrEqual(web3.LAMPORTS_PER_SOL)

    const lamports = await connection.getMinimumBalanceForRentExemption(
      LICENSE_AGREEMENT_SCHEMA_SIZE, // Currently 90
    );
    expect(lamports).toBeGreaterThan(0)
})

const getAgreementPublicKey =  (account) => {
  return  web3.PublicKey.createWithSeed(
    account.publicKey,
      seed,
      programId,
    )
}

test('it creates license account', async () => {

  var connection = utils.getConnection() 

  var account = utils.getKeypair('license_test')
  const agreementPublicKey = await getAgreementPublicKey(account)
  
    const lamports = await connection.getMinimumBalanceForRentExemption(
      LICENSE_AGREEMENT_SCHEMA_SIZE, // Currently 90
    );

     /** The account that will transfer lamports to the created account */
     // fromPubkey: PublicKey;
     /** Public key of the created account. Must be pre-calculated with PublicKey.createWithSeed() */
     // newAccountPubkey: PublicKey;
     /** Base public key to use to derive the address of the created account. Must be the same as the base key used to create `newAccountPubkey` */
     // basePubkey: PublicKey;
     /** Seed to use to derive the address of the created account. Must be the same as the seed used to create `newAccountPubkey` */
     // seed: string;
     /** Amount of lamports to transfer to the created account */
     // lamports: number;
     /** Amount of space in bytes to allocate to the created account */
     // space: number;
     /** Public key of the program to assign as the owner of the created account */
     // programId: PublicKey;
  
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccountWithSeed({
        fromPubkey: account.publicKey,
        newAccountPubkey: agreementPublicKey,
        basePubkey: account.publicKey,
        seed,
        lamports,
        space: LICENSE_AGREEMENT_SCHEMA_SIZE,
        programId,
      }),
    );
    let result = await web3.sendAndConfirmTransaction(connection, transaction, [account]);
    expect(result).not.toBeNull()
})

test('it initializes license account', async () => {

  var connection = utils.getConnection() 

  var account = utils.getKeypair('license_test')
  const agreementPublicKey = await getAgreementPublicKey(account)

  console.log(`agreementPublicKey=${agreementPublicKey.toBase58()}`)

  const licenseePublicKey = utils.getKeypair('licensee')
  const licensorPublicKey = utils.getKeypair('licensor')

  const deposit = 100.0
  const rentAmount = 100.0
  const duration = 12
  const durationUnit = 1
  const instruction = 0

  const buffer = Buffer.from(Uint8Array.of(
    instruction,
    ...Array.from(licenseePublicKey.publicKey.toBytes()),
    ...Array.from(licensorPublicKey.publicKey.toBytes()),
    ...new BN(deposit).toArray("le", 8),
    ...new BN(rentAmount).toArray("le", 8),
    ...new BN(duration).toArray("le", 8),
    ...new BN(durationUnit).toArray("le", 1),
  ))

  const transactionInstruction = new web3.TransactionInstruction({
    keys: [
      { pubkey: agreementPublicKey, isSigner: false, isWritable: true },
      { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId,
    data: buffer
  })

await web3.sendAndConfirmTransaction(
    connection,
    new web3.Transaction().add(transactionInstruction),
    [account],
  );
})