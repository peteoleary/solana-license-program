use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_pack::{IsInitialized, Sealed},
    pubkey::Pubkey,
};
use solana_program::clock::UnixTimestamp;

/// License properties stored in the account
/// search license-account-properties for all the places that need to be changed
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct LicenseAccount {
    pub status: u8, // 1
    pub licensor_pubkey: Pubkey, // 32
    pub licensee_pubkey: Pubkey,   // 32
    pub asset_pubkey: Pubkey,   // 32
    pub license_amount: u64,   // 8
    pub license_start: UnixTimestamp,    // 8
    pub license_end: UnixTimestamp,
}

impl Sealed for LicenseAccount {}

impl IsInitialized for LicenseAccount {
    fn is_initialized(&self) -> bool {
        self.status != LicenseStatus::Uninitialized as u8
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum Duration {
    Months = 0,
}

#[derive(Copy, Clone)]
pub enum LicenseStatus {
    Uninitialized = 0,
    Active,
    Completed,
    Terminated,
}
