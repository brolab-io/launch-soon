use anchor_lang::{prelude::*, system_program::{self, Transfer}};
use anchor_spl::token_interface::{burn, Burn, Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked};

use crate::{Config, Pool, CONFIG_SEED, POOL_SEED, TREASURER_SEED};


#[event]
pub struct PoolFinalizedEvent {
    pub creator: Pubkey,
    pub pool: Pubkey,
    pub mint: Pubkey,
}

#[derive(Accounts)]
pub struct FinalizePool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
      seeds = [CONFIG_SEED],
      bump = config.bump,
      has_one = fee_collector,
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub fee_collector: SystemAccount<'info>,
    #[account(
      mut,
      seeds = [POOL_SEED, creator.key().as_ref(), mint.key().as_ref()],
      bump = pool.bump
    )]
    pub pool: Box<Account<'info, Pool>>,
    #[account(
      mut,
      mint::token_program = token_program,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
      mut,
      associated_token::mint = mint,
      associated_token::authority = creator,
      associated_token::token_program = token_program,
    )]
    pub creator_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: This should be a treasury account
    #[account(
      mut, 
      seeds = [TREASURER_SEED, pool.key().as_ref()],
      bump = pool.treasurer_bump,
    )]
    pub treasurer: AccountInfo<'info>,
    #[account(
      mut,
      associated_token::mint = mint,
      associated_token::authority = treasurer,
      associated_token::token_program = token_program,
    )]
    pub treasurer_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> FinalizePool<'info> {
    pub fn handler(&mut self) -> Result<()> {
      self.pool.validate_for_finalize()?;
    
      let token_amount = self.treasurer.lamports()
      .checked_mul(self.pool.sale_rate).unwrap()
      .checked_div(10u64.pow(9)).unwrap()
      .checked_mul(10u64.pow(self.mint.decimals as u32)).unwrap();
      let remaining_balance = self.treasurer_token_account.amount.checked_sub(token_amount).unwrap();
      let seeds = &[TREASURER_SEED, self.pool.to_account_info().key.as_ref(), &[self.pool.treasurer_bump]];
        let signer_seeds = &[&seeds[..]];
      if remaining_balance.gt(&0) {
        if self.pool.burn_unsold_tokens { 
          msg!("Burning unsold tokens. Remaining balance: {}", remaining_balance);
          
            burn(CpiContext::new_with_signer(
              self.token_program.to_account_info(), 
              Burn { 
                mint: self.mint.to_account_info(), 
                from: self.treasurer_token_account.to_account_info(), 
                authority: self.treasurer.to_account_info()  
              }, signer_seeds), 
              remaining_balance)?;
          
        } else {
          msg!("Refunding unsold tokens to creator. Remaining balance: {}", remaining_balance);
          transfer_checked(
            CpiContext::new_with_signer(
              self.token_program.to_account_info(), 
              TransferChecked { 
                from: self.treasurer_token_account.to_account_info(), 
                to: self.creator_token_account.to_account_info(), 
                authority: self.treasurer.to_account_info(),
                mint: self.mint.to_account_info(), 
              }, signer_seeds), 
              remaining_balance, 
              self.mint.decimals)?;
        }
      }


      // collect fee and return currency to creator
      let lamports = self.treasurer.lamports();
      let (back, fee) = self.config.calculate_fee(lamports)?;

      system_program::transfer(
        CpiContext::new_with_signer(
          self.system_program.to_account_info(), 
          Transfer {
        from: self.treasurer.to_account_info(),
        to: self.creator.to_account_info(),
        
      }, signer_seeds), back)?;

      system_program::transfer(
        CpiContext::new_with_signer(
          self.system_program.to_account_info(), 
          Transfer {
        from: self.treasurer.to_account_info(),
        to: self.fee_collector.to_account_info(),
      } ,signer_seeds), fee)?;


      self.pool.finalized = true;

      emit!(
        PoolFinalizedEvent {
          creator: self.creator.key(),
          pool: self.pool.key(),
          mint: self.mint.key()
        }
      );
     
      Ok(())
    }
}