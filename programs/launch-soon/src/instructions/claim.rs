use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{error::LaunchpadErrorCode, Pool, Record, POOL_SEED, RECORD_SEED, TREASURER_SEED};

#[event]
pub struct ClaimEvent {
    buyer: Pubkey,
    pool: Pubkey,
    mint: Pubkey,
    lamports: u64,
    token_amount: u64,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
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
    #[account(
      mut,
      seeds = [RECORD_SEED, pool.key().as_ref(), buyer.key().as_ref()],
      bump = buyer_record.bump
    )]
    pub buyer_record: Box<Account<'info, Record>>,
    #[account(
      init_if_needed,
      payer = buyer,
      associated_token::mint = mint,
      associated_token::authority = buyer,
      associated_token::token_program = token_program,
    )]
    pub buyer_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Claim<'info> {
    pub fn handler(&mut self) -> Result<()> {
        self.pool.validate_for_claim()?;
        require!(
            self.buyer_record.claimed == false,
            LaunchpadErrorCode::AlreadyClaimed
        );

        let amount = self
            .buyer_record
            .amount
            .checked_mul(self.pool.sale_rate)
            .unwrap()
            .checked_div(10u64.pow(9))
            .unwrap()
            .checked_mul(10u64.pow(self.mint.decimals as u32))
            .unwrap();

        require!(amount.gt(&0), LaunchpadErrorCode::ZeroAmount);

        let seeds = &[
            TREASURER_SEED,
            self.pool.to_account_info().key.as_ref(),
            &[self.pool.treasurer_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer_checked(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.treasurer_token_account.to_account_info(),
                    mint: self.mint.to_account_info(),
                    to: self.buyer_token_account.to_account_info(),
                    authority: self.treasurer.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
            self.mint.decimals,
        )?;

        self.buyer_record.claimed = true;

        emit!(ClaimEvent {
            buyer: self.buyer.key(),
            pool: self.pool.key(),
            mint: self.mint.key(),
            lamports: self.buyer_record.amount,
            token_amount: amount
        });
        Ok(())
    }
}
