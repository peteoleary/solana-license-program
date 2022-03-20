use solana_program::{program_error::ProgramError, pubkey::Pubkey};
use std::convert::TryInto;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::clock::UnixTimestamp;
use solana_program::msg;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum LicenseInstruction {
    /// Initialize the rent contract with the agreed on terms and persist initial state in the agreement account
    ///
    /// Accounts expected:
    /// 0. `[writable]` The Rent Agreement account created to manage state across 2 parties; owned by program id.
    /// 1. `[]` Sysvar Rent Account to validate rent exemption (SYSVAR_RENT_PUBKEY)
    InitializeLicenseContract {
        licensor_pubkey: Pubkey, // 32
        licensee_pubkey: Pubkey,   // 32
        asset_pubkey: Pubkey,   // 32
        license_amount: u64,   // 8
        license_start: UnixTimestamp,    // 8
        license_end: UnixTimestamp
    }

}

impl LicenseInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input
            .split_first()
            .ok_or(ProgramError::InvalidInstructionData)?;

        Ok(match tag {
            0 => {
                // license-account-properties
                let licensor_pubkey: Pubkey = Pubkey::new(&rest[..32]);
                msg!("[LicenseShare] licensor_pubkey: {}", licensor_pubkey);
                let licensee_pubkey: Pubkey = Pubkey::new(&rest[32..64]);
                msg!("[LicenseShare] licensee_pubkey: {}", licensee_pubkey);
                let asset_pubkey: Pubkey = Pubkey::new(&rest[64..96]);
                msg!("[LicenseShare] asset_pubkey: {}", asset_pubkey);
                
                let license_amount: u64 = Self::unpack_u64(&rest, 96)?;
                msg!("[LicenseShare] license_amount: {}", license_amount);
                // TODO check these values!
                let license_start: i64 = Self::unpack_i64(&rest, 104)?;
                msg!("[LicenseShare] license_start: {}", license_start);
                let license_end: i64 = Self::unpack_i64(&rest, 112)?;
                msg!("[LicenseShare] license_end: {}", license_end);

                Self::InitializeLicenseContract {
                    licensor_pubkey,
                    licensee_pubkey,
                    asset_pubkey,
                    license_amount,
                    license_start,
                    license_end
                }
            },
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }

    fn unpack_u64(input: &[u8], start: usize) -> Result<u64, ProgramError> {
        let value = input
            .get(start..8 + start)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(ProgramError::InvalidInstructionData)?;
        Ok(value)
    }

    fn unpack_i64(input: &[u8], start: usize) -> Result<i64, ProgramError> {
        let value = input
            .get(start..8 + start)
            .and_then(|slice| slice.try_into().ok())
            .map(i64::from_le_bytes)
            .ok_or(ProgramError::InvalidInstructionData)?;
        Ok(value)
    }
}
