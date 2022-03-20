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
    state::{LicenseStatus, LicenseAccount},
};

use solana_program::clock::UnixTimestamp;

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = LicenseInstruction::unpack(instruction_data)?;

        match instruction {
            // license-account-properties
            LicenseInstruction::InitializeLicenseContract {
                licensor_pubkey,
                licensee_pubkey,
                asset_pubkey,
                license_amount,
                license_start,
                license_end
            } => Self::initialize_license_contract(
                accounts,
                program_id,
                licensor_pubkey,
                licensee_pubkey,
                asset_pubkey,
                license_amount,
                license_start,
                license_end
            )
        }
    }

    fn initialize_license_contract(
        // license-account-properties
        accounts: &[AccountInfo],
        program_id: &Pubkey,
        licensor_pubkey: Pubkey, // 32
        licensee_pubkey: Pubkey,   // 32
        asset_pubkey: Pubkey,   // 32
        license_amount: u64,   // 8
        license_start: UnixTimestamp,    // 8
        license_end: UnixTimestamp,
    ) -> ProgramResult {
        let accounts_iter = &mut accounts.iter();

        let license_agreement_account = next_account_info(accounts_iter)?;
        if license_agreement_account.owner != program_id {
            msg!("[License] License agreement account not owned by this program");
            return Err(ProgramError::IncorrectProgramId);
        }

        let solana_rent = &Rent::from_account_info(next_account_info(accounts_iter)?)?;
        // Make sure this account is rent exempt
        if !solana_rent.is_exempt(
            license_agreement_account.lamports(),
            license_agreement_account.data_len(),
        ) {
            msg!(
                "[LicenseShare] License agreement account not rent exempt. Balance: {}",
                license_agreement_account.lamports()
            );
            return Err(ProgramError::AccountNotRentExempt);
        }

        // Initialize the License Agreement Account with the initial data
        // Note: the structure of the data state must match the `space` reserved when account created
        let license_agreement_data =
            LicenseAccount::try_from_slice(&license_agreement_account.data.borrow());

        msg!("[LicenseShare] expected {}, got {} bytes", std::mem::size_of::<LicenseAccount>(), license_agreement_account.try_data_len()?);

        if license_agreement_data.is_err() {
            msg!(
                "[LicenseShare] License agreement data error: {}", license_agreement_data.unwrap_err().to_string()
            );
            return Err(ProgramError::InvalidAccountData);
        }

        let mut license_data = license_agreement_data.unwrap();
        if license_data.is_initialized() {
            msg!("[LicenseShare] License agreement already initialized");
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        // license-account-properties
        license_data.status = LicenseStatus::Active as u8;
        license_data.licensor_pubkey = licensor_pubkey;
        license_data.licensee_pubkey = licensee_pubkey;
        license_data.asset_pubkey = asset_pubkey;
        license_data.license_amount = license_amount;
        license_data.license_start = license_start;
        license_data.license_end = license_end;
        license_data.serialize(&mut &mut license_agreement_account.data.borrow_mut()[..])?;

        msg!(
            "[LicenseShare] Initialized license agreement account: {:?}",
            license_data
        );

        Ok(())
    }
}
