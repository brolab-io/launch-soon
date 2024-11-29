use anchor_lang::{prelude::*, system_program::{self, Transfer}};
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked}};

use crate::{error::LaunchpadErrorCode, Config, CreatePoolArgs, Pool, CONFIG_SEED, POOL_SEED, TREASURER_SEED};

#[event]
pub struct CreateNewPoolEvent {
    creator: Pubkey,
    pool: Pubkey,
    mint: Pubkey,
    args: CreatePoolArgs
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
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
      init,
      payer = creator,
      space = 8 + Pool::INIT_SPACE,
      seeds = [POOL_SEED, creator.key().as_ref(), mint.key().as_ref()],
      bump 
    )]
    pub pool: Box<Account<'info, Pool>>,
    #[account(
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
      bump,
    )]
    pub treasurer: AccountInfo<'info>,
    #[account(
      init,
      payer = creator,
      associated_token::mint = mint,
      associated_token::authority = treasurer,
      associated_token::token_program = token_program,
    )]
    pub treasurer_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreatePool<'info> {
    pub fn handler(&mut self, args: CreatePoolArgs, bumps: &CreatePoolBumps) -> Result<()>{
      require!(
        args.start_time > Clock::get()?.unix_timestamp && args.end_time > args.start_time,
        LaunchpadErrorCode::InvalidTimeRange
      );


      let token_amount = args.hard_cap
                                .checked_mul(args.sale_rate)
                                .unwrap()
                                .checked_div(10u64.pow(9))
                                .unwrap()
                                .checked_mul(10u64.pow(self.mint.decimals as u32))
                                .unwrap();
      msg!("Transferring {} tokens to treasurer", token_amount);
      transfer_checked(
        CpiContext::new(self.token_program.to_account_info(), 
        TransferChecked {
          authority: self.creator.to_account_info(),
          from: self.creator_token_account.to_account_info(),
          to: self.treasurer_token_account.to_account_info(),
          mint: self.mint.to_account_info(),
      }), token_amount, self.mint.decimals)?;


      // collect creation fee
      system_program::transfer(
    CpiContext::new(
  self.system_program.to_account_info(), 
Transfer{
            from: self.creator.to_account_info(),
            to: self.fee_collector.to_account_info(),
              },
    ), self.config.creation_fee)?;
      
      
      self.pool.set_inner(
        Pool { 
          authority: self.creator.key(), 
          mint: self.mint.key(), 
          sale_rate: args.sale_rate, 
          start_time: args.start_time, 
          end_time: args.end_time, 
          min_buy: args.min_buy, 
          max_buy: args.max_buy, 
          soft_cap: args.soft_cap, 
          hard_cap: args.hard_cap, 
          bump: bumps.pool,
          treasurer_bump: bumps.treasurer,
          unsold_tokens: token_amount,
          raised: 0,
          burn_unsold_tokens: args.burn_unsold_tokens,
          finalized: false,
          whitelist: None
        }
      );


      emit!(CreateNewPoolEvent {
        creator: self.creator.key(),
        pool: self.pool.key(),
        mint: self.mint.key(),
        args
      });

      
      Ok(())
    }

   

    
}
