const web3 = require('@solana/web3.js')
const BN = require('bn.js')

const utils = require('./utils')
const fs = require('fs')
const { expect } = require('@jest/globals')
const BufferLayout = require('buffer-layout')

require('dotenv').config()

require('datejs')

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


const create_license_account =  async (nft_account, licensee_account, licensor_account) => {

  var connection = utils.getConnection() 

  // TODO: create test NFT here

  const agreementPublicKey = await web3.PublicKey.createWithSeed(nft_account.publicKey, utils.licenseAccountSeed, utils.licenseProgramId)
  
    const lamports = await connection.getMinimumBalanceForRentExemption(
      LICENSE_ACCOUNT_DATA_LAYOUT.span, // Currently 90
    );

    console.log(`createAccount requires ${lamports / web3.LAMPORTS_PER_SOL} sol`)
  
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccountWithSeed({
        fromPubkey: licensee_account.publicKey,
        newAccountPubkey: agreementPublicKey,
        basePubkey: nft_account.publicKey,
        seed: utils.licenseAccountSeed,
        lamports: lamports,
        space: LICENSE_ACCOUNT_DATA_LAYOUT.span,
        programId: utils.licenseProgramId
      }),
    );

    // NOTE: remember the order of signers is important here
    let result = await web3.sendAndConfirmTransaction(connection, transaction, [licensee_account, nft_account]);

}

const rentAmount = 100.0

const init_license_account =  async (nft_account, licensee_account, licensor_account) => {

  var connection = utils.getConnection() 

  const agreementPublicKey = await utils.getAgreementPublicKey(nft_account.publicKey)

  console.log(`agreementPublicKey=${agreementPublicKey.toBase58()}`)

  const instruction = 0

  const current_time = new Date()

  const start_time = current_time.getTime()
  const end_time = current_time.addHours(1).getTime()

  const buffer = Buffer.from(Uint8Array.of(
    instruction,
    ...Array.from(licensor_account.publicKey.toBytes()),
    ...Array.from(licensee_account.publicKey.toBytes()),
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
}

const get_license_account =  async (nft_account, licensee_account, licensor_account) => {
  var connection = utils.getConnection() 

  const agreementPublicKey = await utils.getAgreementPublicKey(nft_account.publicKey)

  const agreementAccount = await connection.getAccountInfo(agreementPublicKey);

  const agreementAccountData = LICENSE_ACCOUNT_DATA_LAYOUT.decode(agreementAccount.data)

  return agreementAccountData
}

module.exports = {create_license_account, init_license_account, get_license_account}