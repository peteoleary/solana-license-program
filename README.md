## Solana License Contract

Adapted liberally from https://github.com/BryanMorgan/rent-share-solana-rust and https://github.com/paul-schaaf/solana-escrow

# Commands

solana config set -k license_test.json
solana config set -u http://127.0.0.1:8899
solana airdrop 10 --keypair js/keys/license_program.json

cargo build-bpf
solana program deploy ./target/deploy/license.so --keypair js/keys/license_program.json
cargo build-bpf && solana program deploy ./target/deploy/license.so --program-id Cb5q9Kd6P7xHtg6dJecEqJmHqXtGRQ25TLkziwSx3AhE

# Testing

Before testing, airdop SOL to the licensee account to pay for creating the license account

solana airdrop 10 5Tna9RJ6Fpd1TAEszCDjvTLW3KSpsSNzSEqu7Xp8KhXF
