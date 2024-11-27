use anchor_lang::{prelude::*, system_program::{self, Transfer}};
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{error::LaunchpadErrorCode, Pool, Record, POOL_SEED, RECORD_SEED, TREASURER_SEED};

#[event]
pub struct BuyEvent {
    buyer: Pubkey,
    pool: Pubkey,
    mint: Pubkey,
    lamports: u64,
    token_amount: u64,
}

#[derive(Accounts)]
pub struct Buy<'info> {
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
      init_if_needed,
      payer = buyer,
      space = 8 + Record::INIT_SPACE,
      seeds = [RECORD_SEED, pool.key().as_ref(), buyer.key().as_ref()],
      bump
    )]
    pub buyer_record: Box<Account<'info, Record>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Buy<'info> {
    pub fn handler(&mut self, lamports: u64, bumps: &BuyBumps) -> Result<()> {
        self.pool.validate_for_buy_or_cancel()?;

        
        let estimated_lamports_amount = self.buyer_record.amount.checked_add(lamports).unwrap();
        msg!("Estimated lamports amount: {}", estimated_lamports_amount);


        require!(
          estimated_lamports_amount.ge(&self.pool.min_buy) && estimated_lamports_amount.le(&self.pool.max_buy),
          LaunchpadErrorCode::InvalidAmount
        );

        let token_amount_can_buy = lamports.checked_mul(self.pool.sale_rate).unwrap()
        .checked_div(10u64.pow(9))
        .unwrap()
        .checked_mul(10u64.pow(self.mint.decimals as u32))
        .unwrap();

        require!(
          token_amount_can_buy <= self.pool.unsold_tokens,
          LaunchpadErrorCode::ReachedAmountLimit
        );

        system_program::transfer(
          CpiContext::new(
            self.system_program.to_account_info(), 
            Transfer {
              from: self.buyer.to_account_info(),
              to: self.treasurer.to_account_info(),
            }
          ), 
        lamports)?;

        self.pool.unsold_tokens = self.pool.unsold_tokens.checked_sub(token_amount_can_buy).unwrap();
        self.pool.raised = self.pool.raised.checked_add(lamports).unwrap();

        self.buyer_record.set_inner(
          Record { 
            user: self.buyer.key(), 
            amount: estimated_lamports_amount, 
            claimed: false,
            bump: bumps.buyer_record 
          });

        emit!(
          BuyEvent {
            buyer: self.buyer.key(),
            pool: self.pool.key(),
            mint: self.mint.key(),
            lamports,
            token_amount: token_amount_can_buy,
          }
        );

        Ok(())
    }
}
