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

  const getPrivateKey = (name) =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(`./keys/${name}.json`))
  );

  const getKeypair = (name) =>
  new web3.Keypair({
    publicKey: getPublicKey(name).toBytes(),
    secretKey: getPrivateKey(name),
  });

  const getProgramId = () => {
  try {
    return getPublicKey("program");
  } catch (e) {
    logError("Given programId is missing or incorrect");
    process.exit(1);
  }
};

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

    return await connection.getAccountInfo(publicKey);
}

const getConnection = () => {
  return new web3.Connection("http://localhost:8899", "confirmed");
}

module.exports = {getConnection, getPrivateKey, airDrop, getKeypair}