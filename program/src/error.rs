use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum LicenseError {
    /// License not in effect
    #[error("License is not valid")]
    LicenseInvalid = 100,
}

impl From<LicenseError> for ProgramError {
    fn from(e: LicenseError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
