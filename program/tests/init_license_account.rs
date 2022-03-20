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
use borsh::{BorshDeserialize, BorshSerialize};
use futures::{future::join_all, Future, FutureExt};

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

fn make_license_account_init_instruction_data() -> Vec<u8> {

    // TODO: these are solana_sdk::pubkey::Pubkey
    let payee = Keypair::new();
    let payer = Keypair::new();

    let license_init_instructions = license::instruction::LicenseInstruction::InitializeLicenseContract {
           
        // license-account-properties
        payee_pubkey:  solana_program::pubkey::Pubkey::new_rand(),
        payer_pubkey: solana_program::pubkey::Pubkey::new_rand(),
        deposit: 100,
        rent_amount: 100,
        duration: 12,
        duration_unit: 1
    };

    return license_init_instructions.try_to_vec().unwrap();
}

const SEED: &str = "agreement_account";

fn get_agreement_public_key(account: &Keypair, program_id: &Pubkey) -> Pubkey {
    return Pubkey::create_with_seed(&account.pubkey(), SEED, &program_id).unwrap();
}
async fn do_init_license_account(mut context: ProgramTestContext, program_id: Pubkey, account_owner: Keypair, license_account: &Pubkey) -> license::state::LicenseAccount {

    let data: Vec<u8> =  make_license_account_init_instruction_data();

    let init_license_account_instruction = Instruction {
        program_id: program_id,
        accounts: [AccountMeta::new(*license_account, false),].to_vec(),
        data: data
    };

    let mut transaction = Transaction::new_with_payer(
        &[
            init_license_account_instruction
        ],
        Some(&account_owner.pubkey()),
    );
    transaction.sign(&[&account_owner], context.last_blockhash);
    context.banks_client.process_transaction(transaction).await.unwrap();

    let data_future = context.banks_client.get_account_data_with_borsh::<license::state::LicenseAccount>(*license_account);

    return data_future.await.unwrap();
}

#[cfg(test)]
mod create_license_account {
    use super::*;

    #[tokio::test]
    async fn instruction_data() {
       let raw_data = make_license_account_init_instruction_data();
       assert!(raw_data[0] == 0);

       let data = license::instruction::LicenseInstruction::try_from_slice(&raw_data).unwrap();

       println!("data: {:?}", data);

       match data {
        license::instruction::LicenseInstruction::InitializeLicenseContract{
            payee_pubkey,
            payer_pubkey,
            deposit,
            rent_amount,
            duration,
            duration_unit
        } =>  { 
                assert!(true) 
            },
        _ => assert!(false)
       }
    }

    #[tokio::test]
    async fn success() {
        let program_id =  Pubkey::from_str("91FXCUBpyaMzSb1jBjwUjYxBmUvyPLTqEzKKHvqjtY7V").unwrap();
        // TODO: get program id string from somewhere... else?

        let program_test = ProgramTest::new("license", program_id, None);

        // Start executing test.
        let mut context = program_test.start_with_context().await;

        let rent = context.banks_client.get_rent().await.unwrap();

        let mint_rent = rent.minimum_balance(mem::size_of::<license::state::LicenseAccount>());
       
        let account_owner = Keypair::new();

        airdrop(& mut context, &account_owner.pubkey(), 10_000_000_000).await.unwrap();

        let account_address = get_agreement_public_key(&account_owner, &program_id);

        let mut transaction = Transaction::new_with_payer(
            &[
                system_instruction::create_account_with_seed(
                    &account_owner.pubkey(),
                    &account_address,
                    &account_owner.pubkey(),
                    SEED,
                    mint_rent,
                    mem::size_of::<license::state::LicenseAccount>() as u64,
                    &program_id,
                )
                // TODO: add additional instruction
            ],
            Some(&account_owner.pubkey()),
        );
        transaction.sign(&[&context.payer, &account_owner], context.last_blockhash);
        let result = context.banks_client.process_transaction(transaction).await.unwrap();

        let account_data = do_init_license_account(context, program_id, account_owner, &account_address).await;

        assert!(account_data.status == license::state::AgreementStatus::Active as u8);
    }
}