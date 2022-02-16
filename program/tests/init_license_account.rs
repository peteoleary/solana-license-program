#![cfg(feature = "test-bpf")]

use solana_program_test::*;
use solana_program::msg;
use solana_sdk::{
    account::Account,
    hash::Hash,
    instruction::{AccountMeta, Instruction},
    program_pack::Pack,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction, system_program,
    transaction::{Transaction, TransactionError},
    transport::TransportError,
    signers::Signers
};
use std::str::FromStr;
use license::*;
use std::mem;

pub async fn airdrop(
    context: &mut ProgramTestContext,
    receiver: &Pubkey,
    amount: u64,
) -> Result<(), TransportError> {
    let tx = Transaction::new_signed_with_payer(
        &[system_instruction::transfer(
            &context.payer.pubkey(),
            receiver,
            amount,
        )],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );

    context.banks_client.process_transaction(tx).await.unwrap();
    Ok(())
}


mod create_license_account {
    use super::*;
    #[tokio::test]
    async fn success() {
        // TODO: get program id from somewhere... else?
        let mut program_test =
        ProgramTest::new("license", Pubkey::from_str("91FXCUBpyaMzSb1jBjwUjYxBmUvyPLTqEzKKHvqjtY7V").unwrap(), None);

        // Start executing test.
        let mut context = program_test.start_with_context().await;

        // let payer = Keypair::new();
        // airdrop(& mut context, &payer.pubkey(), 10_000_000_000).await;

        let rent = context.banks_client.get_rent().await.unwrap();

        let mint_rent = rent.minimum_balance(mem::size_of::<license::state::LicenseAccount>());
        let pool_mint = Keypair::new();
        let manager = Keypair::new();
        let mut transaction = Transaction::new_with_payer(
            &[
                system_instruction::create_account(
                    &context.payer.pubkey(),
                    &pool_mint.pubkey(),
                    mint_rent,
                    mem::size_of::<license::state::LicenseAccount>() as u64,
                    &spl_token::id(),
                )
                // TODO: add license init account instruction
            ],
            Some(&context.payer.pubkey()),
        );
        transaction.sign(&[&context.payer, &pool_mint], context.last_blockhash);
        let result = context.banks_client.process_transaction(transaction).await.unwrap();

        assert!(true);
    }
}