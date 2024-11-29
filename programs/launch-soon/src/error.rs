use anchor_lang::prelude::*;

#[error_code]
pub enum LaunchpadErrorCode {
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
    InvalidTimeRange,
    PoolAlreadyFinalized,
    PoolNotFinalized,
    NotReadyToFinalize,
    TimeOut,
    InvalidAmount,
    ReachedAmountLimit,
    AlreadyClaimed,
    ZeroAmount,
    BadRequest,
    NotInWhitelist,
}
