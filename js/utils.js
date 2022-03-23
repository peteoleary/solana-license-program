const web3 = require('@solana/web3.js')
const fs = require('fs')

const logError = (msg) => {
  console.log(`\x1b[31m${msg}\x1b[0m`);
};

const writePublicKey = (publicKey, name) => {
  console.log(`writing ${publicKey.toBase58()} to ${name}`)
  fs.writeFileSync(
    `./keys/${name}.pub.json`,
    publicKey.toString()
  );
};

const getPublicKey = (name) =>
  new web3.PublicKey(
   fs.readFileSync(`./keys/${name}.pub.txt`).toString()
  );

  const getPrivateKeyFromPath = (path) =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(path))
  );

  const getKeypair = (name) => getKeypairFromPath(`./keys/${name}.json`)

  const getKeypairFromPath = (path) => web3.Keypair.fromSecretKey(getPrivateKeyFromPath(path))

  const getLicenseProgramId = () => {
  try {
    return getKeypairFromPath('../target/deploy/license-keypair.json').publicKey;
  } catch (e) {
    logError(`getLicenseProgramId failed: ${e.message}`);
    process.exit(1);
  }
};

const licenseProgramId = getLicenseProgramId()

const  getTokenBalance = async (
  pubkey,
  connection
) => {
  return parseInt(
    (await connection.getTokenAccountBalance(pubkey)).value.amount
  );
};

const airDrop = async (connection, publicKey) => {
  var airdropSignature = await connection.requestAirdrop(
    publicKey,
    web3.LAMPORTS_PER_SOL,
    );

    //wait for airdrop confirmation
    await connection.confirmTransaction(airdropSignature);

    return connection.getAccountInfo(publicKey);
}

const getConnection = (network = "http://localhost:8899") => {
  return new web3.Connection(network, "confirmed");
}

const getAgreementPublicKey =  async (nft_account_pubkey) => 
  web3.PublicKey.createWithSeed(nft_account_pubkey, licenseAccountSeed, licenseProgramId)


const licenseAccountSeed = 'license_account'

module.exports = {getConnection, getPublicKey, airDrop, getKeypair, getAgreementPublicKey, licenseProgramId, licenseAccountSeed}