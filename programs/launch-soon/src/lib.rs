pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("DwhYs3FcJFbME9hkQkkEnvvk75kXYeRFrewAzkV7QgxS");

#[program]
pub mod launch_soon {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee: u16) -> Result<()> {
        ctx.accounts.handler(fee, &ctx.bumps)
    }
}
