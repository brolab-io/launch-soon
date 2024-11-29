use crate::error::LaunchpadErrorCode;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub sale_rate: u64, // If I spend 1 currency on how many tokens will I receive?
    // pub listing_rate: u64, // If I spend 1 currency on how many tokens will I receive when token listed?
    pub start_time: i64,
    pub end_time: i64,
    pub min_buy: u64,
    pub max_buy: u64,
    pub soft_cap: u64,
    pub hard_cap: u64,
    pub unsold_tokens: u64,
    pub burn_unsold_tokens: bool,
    pub finalized: bool,
    pub raised: u64,
    pub whitelist: Option<[u8; 32]>,
    pub bump: u8,
    pub treasurer_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Copy)]
pub struct CreatePoolArgs {
    pub sale_rate: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub min_buy: u64,
    pub max_buy: u64,
    pub soft_cap: u64,
    pub hard_cap: u64,
    pub burn_unsold_tokens: bool,
}

impl Pool {
    pub fn validate_for_buy_or_cancel(&self) -> Result<()> {
        require!(
            self.finalized == false,
            LaunchpadErrorCode::PoolAlreadyFinalized
        );
        require!(
            self.start_time <= Clock::get()?.unix_timestamp
                && self.end_time >= Clock::get()?.unix_timestamp,
            LaunchpadErrorCode::TimeOut
        );

        Ok(())
    }

    pub fn validate_for_finalize(&self) -> Result<()> {
        require!(
            self.finalized == false,
            LaunchpadErrorCode::PoolAlreadyFinalized
        );
        require!(
            self.end_time < Clock::get()?.unix_timestamp,
            LaunchpadErrorCode::NotReadyToFinalize
        );

        Ok(())
    }

    pub fn validate_for_claim(&self) -> Result<()> {
        require!(self.finalized == true, LaunchpadErrorCode::PoolNotFinalized);

        Ok(())
    }

    pub fn merkle_verify(&self, proof: Vec<[u8; 32]>, leaf: [u8; 32]) -> bool {
        let mut computed_hash = leaf;
        for proof_element in proof.into_iter() {
            if computed_hash <= proof_element {
                computed_hash = keccak::hashv(&[&computed_hash, &proof_element]).0;
            } else {
                computed_hash = keccak::hashv(&[&proof_element, &computed_hash]).0;
            }
        }
        computed_hash == self.whitelist.unwrap()
    }
}
