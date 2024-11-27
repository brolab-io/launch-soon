use anchor_lang::prelude::*;

use crate::{Config, CONFIG_SEED};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    pub fee_collector: SystemAccount<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn handler(
        &mut self,
        fee_rate: u16,
        creation_fee: u64,
        bumps: &InitializeBumps,
    ) -> Result<()> {
        self.config.authority = self.signer.key();
        self.config.bump = bumps.config;
        self.config.fee_collector = self.fee_collector.key();
        self.config.creation_fee = creation_fee;
        self.config.set_fee_rate(fee_rate)?;

        Ok(())
    }
}
