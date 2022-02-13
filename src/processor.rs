use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    program_pack::IsInitialized,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};

use crate::{
    error::LicenseError,
    instruction::LicenseInstruction,
    state::{AgreementStatus, LicenseAccount},
};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = LicenseInstruction::unpack(instruction_data)?;

        match instruction {
            LicenseInstruction::InitializeLicenseContract {
                payee_pubkey,
                payer_pubkey,
                deposit,
                rent_amount,
                duration,
                duration_unit,
            } => Self::initialize_license_contract(
                accounts,
                program_id,
                payee_pubkey,
                payer_pubkey,
                deposit,
                rent_amount,
                duration,
                duration_unit,
            )
        }
    }

    fn initialize_license_contract(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
        payee_pubkey: Pubkey,
        payer_pubkey: Pubkey,
        deposit: u64,
        rent_amount: u64,
        duration: u64,
        duration_unit: u8,
    ) -> ProgramResult {
        let accounts_iter = &mut accounts.iter();

        let rent_agreement_account = next_account_info(accounts_iter)?;
        if rent_agreement_account.owner != program_id {
            msg!("[RentShare] Rent agreement account not owned by this program");
            return Err(ProgramError::IncorrectProgramId);
        }

        let solana_rent = &Rent::from_account_info(next_account_info(accounts_iter)?)?;
        // Make sure this account is rent exemtpt
        if !solana_rent.is_exempt(
            rent_agreement_account.lamports(),
            rent_agreement_account.data_len(),
        ) {
            msg!(
                "[RentShare] Rent agreement account not rent exempt. Balance: {}",
                rent_agreement_account.lamports()
            );
            return Err(ProgramError::AccountNotRentExempt);
        }

        // Initialize the Rent Agreement Account with the initial data
        // Note: the structure of the data state must match the `space` reserved when account created
        let rent_agreement_data =
            LicenseAccount::try_from_slice(&rent_agreement_account.data.borrow());

        if rent_agreement_data.is_err() {
            msg!(
                "[RentShare] Rent agreement account data size incorrect: {}",
                rent_agreement_account.try_data_len()?
            );
            return Err(ProgramError::InvalidAccountData);
        }

        let mut rent_data = rent_agreement_data.unwrap();
        if rent_data.is_initialized() {
            msg!("[RentShare] Rent agreement already initialized");
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        rent_data.status = AgreementStatus::Active as u8;
        rent_data.payee_pubkey = payee_pubkey;
        rent_data.payer_pubkey = payer_pubkey;
        rent_data.rent_amount = rent_amount;
        rent_data.deposit = deposit;
        rent_data.duration = duration;
        rent_data.duration_unit = duration_unit;
        rent_data.remaining_payments = duration;
        rent_data.serialize(&mut &mut rent_agreement_account.data.borrow_mut()[..])?;

        msg!(
            "[RentShare] Initialized rent agreement account: {:?}",
            rent_data
        );

        Ok(())
    }
}
