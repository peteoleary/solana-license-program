use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_pack::{IsInitialized, Sealed},
    pubkey::Pubkey,
};

/// Rent Share Account state stored in the Agreement Account
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct LicenseAccount {
    pub status: u8,
    pub payee_pubkey: Pubkey,
    pub payer_pubkey: Pubkey,
    pub deposit: u64,
    pub rent_amount: u64,
    pub duration: u64,
    pub duration_unit: u8,
    pub remaining_payments: u64,
}

impl Sealed for LicenseAccount {}

impl IsInitialized for LicenseAccount {
    fn is_initialized(&self) -> bool {
        self.status != AgreementStatus::Uninitialized as u8
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum Duration {
    Months = 0,
}

#[derive(Copy, Clone)]
pub enum AgreementStatus {
    Uninitialized = 0,
    Active,
    Completed,
    Terminated,
}
