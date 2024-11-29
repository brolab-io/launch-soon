pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("DJrC94xEi8AMbHh2Qz73CgovU9VfHW5F8MWS53KUisAz");

#[program]
pub mod launch_soon {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_rate: u16, creation_fee: u64) -> Result<()> {
        ctx.accounts.handler(fee_rate, creation_fee, &ctx.bumps)
    }

    pub fn create_pool(ctx: Context<CreatePool>, args: CreatePoolArgs) -> Result<()> {
        ctx.accounts.handler(args, &ctx.bumps)
    }

    pub fn finalize_pool(ctx: Context<FinalizePool>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn buy(ctx: Context<Buy>, lamports: u64, proof: Option<Vec<[u8; 32]>>) -> Result<()> {
        ctx.accounts.handler(lamports, proof, &ctx.bumps)
    }

    pub fn cancel_buy(ctx: Context<CancelBuy>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn set_whitelist(ctx: Context<SetWhitelist>, whitelist: [u8; 32]) -> Result<()> {
        ctx.accounts.handler(whitelist)
    }
}
