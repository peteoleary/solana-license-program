const web3 = require('@solana/web3.js')
const BN = require('bn.js')

const utils = require('./utils')
const fs = require('fs')
const { expect } = require('@jest/globals')
// const { async } = require('regenerator-runtime')
const BufferLayout = require('buffer-layout')

require('datejs')

test('it reads key files', async () => {
  var program_owner_keys = utils.getKeypair('license_program')
  var program_owner_pubkey = utils.getPublicKey('license_program')

  expect (program_owner_keys.publicKey.toBase58()).toBe(program_owner_pubkey.toBase58())

  expect (utils.licenseProgramId.toBase58()).toBe('Cb5q9Kd6P7xHtg6dJecEqJmHqXtGRQ25TLkziwSx3AhE')

  var nft_account = utils.getKeypair('nft_account')
  var licensee_account = utils.getKeypair('licensee')

  const agreementPublicKey = await utils.getAgreementPublicKey(nft_account.publicKey)
  
  expect(agreementPublicKey.toBase58().length).toBe(44)
})

/**
 * Layout for a public key
 */
 const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
};


// license-account-properties from program/src/state.rs
/* 
pub struct LicenseAccount {
    pub status: u8, // 1
    pub licensor_pubkey: Pubkey, // 32
    pub licensee_pubkey: Pubkey,   // 32
    pub asset_pubkey: Pubkey,   // 32
    pub license_amount: u64,   // 8
    pub license_start: UnixTimestamp,    // 8
    pub license_end: UnixTimestamp,
}
*/
const LICENSE_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
  BufferLayout.u8("status"),
  publicKey("licensor_pubkey"),
  publicKey("licensee_pubkey"),
  publicKey("asset_pubkey"),
  BufferLayout.nu64("license_amount"),
  BufferLayout.ns64("license_start"),
  BufferLayout.ns64("license_end")
]);

test('it gets a valid connection', async () => {  
    var connection = utils.getConnection()

    var wallet = utils.getKeypair('licensee')

   let account = await utils.airDrop(connection, wallet.publicKey)

    expect(account.lamports).toBeGreaterThanOrEqual(web3.LAMPORTS_PER_SOL)

    const lamports = await connection.getMinimumBalanceForRentExemption(
      LICENSE_ACCOUNT_DATA_LAYOUT.span,
    );
    expect(lamports).toBeGreaterThan(0)
})

function get_test_accounts() {
  return [utils.getKeypair('nft_account'), utils.getKeypair('licensee'), utils.getKeypair('licensor')]
}

test('it creates license account', async () => {

  var connection = utils.getConnection() 

  const [nft_account, licensee_account, licensor_account] = get_test_accounts()

  const agreementPublicKey = await web3.PublicKey.createWithSeed(nft_account.publicKey, 'license', utils.licenseProgramId)
  
    const lamports = await connection.getMinimumBalanceForRentExemption(
      LICENSE_ACCOUNT_DATA_LAYOUT.span, // Currently 90
    );

    console.log(`createAccount requires ${lamports / web3.LAMPORTS_PER_SOL} sol`)
  
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccountWithSeed({
        fromPubkey: licensee_account.publicKey,
        newAccountPubkey: agreementPublicKey,
        basePubkey: nft_account.publicKey,
        seed: 'license',
        lamports: lamports,
        space: LICENSE_ACCOUNT_DATA_LAYOUT.span,
        programId: utils.licenseProgramId
      }),
    );

    // NOTE: remember the order of signers is important here
    let result = await web3.sendAndConfirmTransaction(connection, transaction, [licensee_account, nft_account]);
    expect(result).not.toBeNull()
})

const rentAmount = 100.0

test('it initializes license account', async () => {

  var connection = utils.getConnection() 

  const [nft_account, licensee_account, licensor_account] = get_test_accounts()

  const agreementPublicKey = await utils.getAgreementPublicKey(nft_account.publicKey)

  console.log(`agreementPublicKey=${agreementPublicKey.toBase58()}`)

  const instruction = 0

  const current_time = new Date()

  const start_time = current_time.getTime()
  const end_time = current_time.addHours(1).getTime()

  const buffer = Buffer.from(Uint8Array.of(
    instruction,
    ...Array.from(licensee_account.publicKey.toBytes()),
    ...Array.from(licensor_account.publicKey.toBytes()),
    ...Array.from(nft_account.publicKey.toBytes()),
    ...new BN(rentAmount).toArray("le", 8),
    ...new BN(start_time).toArray("le", 8),
    ...new BN(end_time).toArray("le", 8)
  ))

  const transactionInstruction = new web3.TransactionInstruction({
    keys: [
      { pubkey: agreementPublicKey, isSigner: false, isWritable: true },
      { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ],
    programId: utils.licenseProgramId,
    data: buffer
  })

  const transactionResult = await web3.sendAndConfirmTransaction(
      connection,
      new web3.Transaction().add(transactionInstruction),
      [licensee_account],
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