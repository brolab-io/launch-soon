use anchor_lang::prelude::*;

use crate::error::LaunchpadErrorCode;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub fee_collector: Pubkey,
    pub creation_fee: u64,
    pub fee_rate: u16,
    pub bump: u8,
}

impl Config {
    pub fn set_fee_rate(&mut self, fee_rate: u16) -> Result<()> {
        require!(
            fee_rate.gt(&0) && fee_rate.le(&10_000),
            LaunchpadErrorCode::InvalidFeeRate
        );
        self.fee_rate = fee_rate;
        Ok(())
    }

    pub fn calculate_fee(&self, amount: u64) -> Result<(u64, u64)> {
        let fee = amount
            .checked_mul(self.fee_rate as u64)
            .unwrap()
            .checked_div(10_000)
            .unwrap();
        Ok((amount - fee, fee))
    }
}
