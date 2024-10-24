use anchor_lang::prelude::*;

use crate::{Setting, SETTING_SEED};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Setting::INIT_SPACE,
        seeds = [SETTING_SEED],
        bump
    )]
    pub setting: Account<'info, Setting>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn handler(&mut self, fee: u16, bumps: &InitializeBumps) -> Result<()> {
        self.setting.set_inner(Setting {
            authority: self.authority.key(),
            fee,
            bump: bumps.setting,
        });
        Ok(())
    }
}
