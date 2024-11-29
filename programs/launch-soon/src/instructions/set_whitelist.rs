use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{error::LaunchpadErrorCode, Pool, POOL_SEED};

#[derive(Accounts)]
pub struct SetWhitelist<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
      mut,
      seeds = [POOL_SEED, creator.key().as_ref(), mint.key().as_ref()],
      bump = pool.bump
    )]
    pub pool: Box<Account<'info, Pool>>,
    #[account(
      mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> SetWhitelist<'info> {
    pub fn handler(&mut self, merkle_root: [u8; 32]) -> Result<()> {
        require!(
            self.pool.finalized == false,
            LaunchpadErrorCode::PoolAlreadyFinalized
        );

        self.pool.whitelist = Some(merkle_root);
        Ok(())
    }
}
