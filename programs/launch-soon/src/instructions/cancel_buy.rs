use anchor_lang::{prelude::*, system_program::{self, Transfer}};
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{Pool, Record, POOL_SEED, RECORD_SEED, TREASURER_SEED};

#[event]
pub struct CancelBuyEvent {
  buyer: Pubkey,
  pool: Pubkey,
  mint: Pubkey,
  lamports: u64,
}

#[derive(Accounts)]
pub struct CancelBuy<'info> {
  #[account(mut)]
  pub buyer: Signer<'info>,
  #[account(
    mut,
    seeds = [POOL_SEED, pool.authority.as_ref(), mint.key().as_ref()],
    bump = pool.bump
  )]
  pub pool: Box<Account<'info, Pool>>,
  #[account(
    mint::token_program = token_program,
  )]
  pub mint: Box<InterfaceAccount<'info, Mint>>,
  /// CHECK: This should be a treasurer account
  #[account(
    mut, 
    seeds = [TREASURER_SEED, pool.key().as_ref()],
    bump = pool.treasurer_bump,
  )]
  pub treasurer: AccountInfo<'info>,
  #[account(
    mut,
    seeds = [RECORD_SEED, pool.key().as_ref(), buyer.key().as_ref()],
    bump = buyer_record.bump,
    close = buyer,
  )]
  pub buyer_record: Box<Account<'info, Record>>,
  pub token_program: Interface<'info, TokenInterface>,
  pub system_program: Program<'info, System>,
}

impl<'info> CancelBuy<'info> {
  pub fn handler(&mut self) -> Result<()> {
    self.pool.validate_for_buy_or_cancel()?;

    let lamports = self.buyer_record.amount;
    let token_amount_bougth = lamports.checked_mul(self.pool.sale_rate).unwrap()
    .checked_div(10u64.pow(9))
    .unwrap()
    .checked_mul(10u64.pow(self.mint.decimals as u32))
    .unwrap();

    let seeds = &[TREASURER_SEED, self.pool.to_account_info().key.as_ref(), &[self.pool.treasurer_bump]];
    let signer_seeds = &[&seeds[..]];

    system_program::transfer(
      CpiContext::new_with_signer(
        self.system_program.to_account_info(), 
        Transfer {
          from: self.treasurer.to_account_info(),
          to: self.buyer.to_account_info(),
        },
        signer_seeds,
      ), 
    lamports)?;

    self.pool.unsold_tokens = self.pool.unsold_tokens.checked_add(token_amount_bougth).unwrap();
    self.pool.raised = self.pool.raised.checked_sub(lamports).unwrap();

    emit!(CancelBuyEvent {
      buyer: self.buyer.key(),
      pool: self.pool.key(),
      mint: self.mint.key(),
      lamports
    });
    Ok(())
  }
    
}