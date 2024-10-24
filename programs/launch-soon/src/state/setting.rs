use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Setting {
    pub authority: Pubkey,
    pub fee: u16,
    pub bump: u8,
}
