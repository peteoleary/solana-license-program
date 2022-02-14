## Solana License Contract

Adapted liberally from https://github.com/BryanMorgan/rent-share-solana-rust and https://github.com/paul-schaaf/solana-escrow

# Commands

solana config set -k license_test.json
solana config set -u http://127.0.0.1:8899
solana airdrop 10 --keypair keys/license_program.json

cargo build-bpf
solana program deploy ./target/deploy/license.so --keypair keys/license_program.json
solana program deploy ./target/deploy/license.so ----program-id 91FXCUBpyaMzSb1jBjwUjYxBmUvyPLTqEzKKHvqjtY7V --keypair keys/license_program.json
