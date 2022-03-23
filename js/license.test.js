const utils = require('./utils')
const { expect } = require('@jest/globals')
const {create_license_account, init_license_account, get_license_account} = require('./license_utils')
const web3 = require('@solana/web3.js')
const test_blockchain_api = require('./theblockchainapi')

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

  // TODO: licensee_account needs SOL!

  const [nft_account, licensee_account, licensor_account] = get_test_accounts()

  const result = await create_license_account(nft_account, licensee_account, licensor_account)
  expect(result).not.toBeNull()
})

test('it initializes license account', async () => {

  const [nft_account, licensee_account, licensor_account] = get_test_accounts()
  const result = await init_license_account(nft_account, licensee_account, licensor_account)
  expect(result).not.toBeNull()

    // TODO: check transactionResult
})

test('it verifies license account data after initialization', async () => {
  
  const [nft_account, licensee_account, licensor_account] = get_test_accounts()
  const agreementAccountData = await get_license_account(nft_account, licensee_account, licensor_account)

  expect(agreementAccountData.status).not.toBe(0)

  expect(new web3.PublicKey(agreementAccountData.licensor_pubkey).toBase58()).toBe(licensor_account.publicKey.toBase58())
})

test('it creates a test NFT', async () => {
  await test_blockchain_api()
})