## Solana License Contract

Adapted liberally from https://github.com/BryanMorgan/rent-share-solana-rust and https://github.com/paul-schaaf/solana-escrow

# Commands

solana config set -k license_test.json
solana config set -u http://127.0.0.1:8899
solana airdrop 10
cargo build-bpf
solana program deploy ./target/deploy/license.so --keypair keys/license_program.json

Program ID is 91FXCUBpyaMzSb1jBjwUjYxBmUvyPLTqEzKKHvqjtY7V