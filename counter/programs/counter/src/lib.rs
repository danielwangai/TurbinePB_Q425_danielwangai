use anchor_lang::prelude::*;

declare_id!("DwFMTKdVoSUpKSrD2uYJg2Jy1URxCiA3BNyDWgJXyhXt");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        msg!(
            "Counter account created with initial value: {:?}",
            counter.count
        );
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).unwrap(); // checked_add is to prevent overflow
        msg!("Counter incremented to: {:?}", counter.count);
        Ok(())
    }

    pub fn decrement(ctx: Context<Decrement>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_sub(1).unwrap(); // checked_sub is to prevent underflow
        msg!("Counter decremented to: {:?}", counter.count);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // this is the account that will pay for the transaction
    #[account(
        init, // create a new account
        payer = authority, // this is the account that will pay for the transaction
        space = 8 + 8, // allocated space(8 for discriminator and 8 for the counter value(u64))
        seeds = [b"counter", authority.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    pub authority: Signer<'info>,
    // mutable to be able to increase the counter value
    #[account(
        mut,
        seeds = [b"counter", authority.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
}

#[derive(Accounts)]
pub struct Decrement<'info> {
    pub authority: Signer<'info>,
    // mutable to be able to decrease the counter value
    #[account(
        mut,
        seeds = [b"counter", authority.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
}

// this is the account that will store the counter value
#[account]
pub struct Counter {
    pub count: u64,
}
