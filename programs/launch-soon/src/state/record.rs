use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Record {
    pub user: Pubkey,
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}
