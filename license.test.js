const web3 = require('@solana/web3.js')
const BN = require('bn.js')

const utils = require('./utils')
const fs = require('fs')
const { expect } = require('@jest/globals')
// const { async } = require('regenerator-runtime')
const BufferLayout = require('buffer-layout')

const programId = new web3.PublicKey('91FXCUBpyaMzSb1jBjwUjYxBmUvyPLTqEzKKHvqjtY7V')
const seed = 'agreement_account'

test('it reads key files', async () => {
  var account = utils.getKeypair('license_test')
  expect(account.publicKey.toBase58().length).toBe(44)
  const agreementPublicKey = await getAgreementPublicKey(account)
  expect(agreementPublicKey.toBase58().length).toBe(44)
})

/**
 * Layout for a public key
 */
 const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
};

/*
pub struct LicenseAccount {
    pub status: u8, // 1
    pub payee_pubkey: Pubkey, // 32
    pub payer_pubkey: Pubkey,   // 32
    pub deposit: u64,   // 8
    pub rent_amount: u64,   // 8
    pub duration: u64,  // 8
    pub duration_unit: u8,  // 1
    pub remaining_payments: u64,    // 8
}
*/

const LICENSE_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
  BufferLayout.u8("status"),
  publicKey("payee_pubkey"),
  publicKey("payer_pubkey"),
  BufferLayout.nu64("deposit"),
  BufferLayout.nu64("rent_amount"),
  BufferLayout.nu64("duration"),
  BufferLayout.u8("duration_unit"),
  BufferLayout.nu64("remaining_payments")
]);

test('it gets a valid connection', async () => {  
    var connection = utils.getConnection()

    var wallet = utils.getKeypair('license_test')

   let account = await utils.airDrop(connection, wallet.publicKey)

    expect(account.lamports).toBeGreaterThanOrEqual(web3.LAMPORTS_PER_SOL)

    const lamports = await connection.getMinimumBalanceForRentExemption(
      LICENSE_ACCOUNT_DATA_LAYOUT.span,
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
      LICENSE_ACCOUNT_DATA_LAYOUT.span, // Currently 90
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
        space: LICENSE_ACCOUNT_DATA_LAYOUT.span,
        programId,
      }),
    );
    let result = await web3.sendAndConfirmTransaction(connection, transaction, [account]);
    expect(result).not.toBeNull()
})

const deposit = 100.0
const rentAmount = 100.0
const duration = 12
const durationUnit = 1

test('it initializes license account', async () => {

  var connection = utils.getConnection() 

  var account = utils.getKeypair('license_test')
  const agreementPublicKey = await getAgreementPublicKey(account)

  console.log(`agreementPublicKey=${agreementPublicKey.toBase58()}`)

  const licenseePublicKey = utils.getKeypair('licensee')
  const licensorPublicKey = utils.getKeypair('licensor')

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

  const transactionResult = await web3.sendAndConfirmTransaction(
      connection,
      new web3.Transaction().add(transactionInstruction),
      [account],
    );

    // TODO: check transactionResult
})

test('it verifies license account data after initialization', async () => {
  var connection = utils.getConnection() 

  var account = utils.getKeypair('license_test')
  const agreementPublicKey = await getAgreementPublicKey(account)

  const agreementAccount = await connection.getAccountInfo(agreementPublicKey);

  const agreementAccountData = LICENSE_ACCOUNT_DATA_LAYOUT.decode(agreementAccount.data)

  expect(agreementAccountData.deposit).toBe(deposit)

  const licenseePublicKey = utils.getKeypair('licensee')

  expect(agreementAccountData.payee_pubkey).toEqual(licenseePublicKey.publicKey.toBytes())

})