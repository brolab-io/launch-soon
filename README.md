# A Launchpad Dapp for token presale

# Pitch slide

[Slide](https://docs.google.com/presentation/d/1UL65zx5oM9hpXsKOly_ytumd9IgOlIgLdHznEfoc_9k/edit?usp=sharing)

# Features

- Init dapp config
- Create a launchpool for token presale
- Buy token via launchpool
- Canncel buy if you want
- Finalize launchpool
- Claim token after pool finalized

# How it work?

- Admin init program with config include:

  - admin address (**_authority_**)
  - address to collect fee (**_fee_collector_**)
  - how many currency platform will collect when new pool created (**_creation_fee_**)
  - how many currency platform will keep when pool finalize (**_fee_rate_**)

- User (**_creator_**) make a transaction to create a new lauchpad pool for presale their token.

  - what token mint to sale (**_mint_**),
  - If I spend 1 currency on how many tokens will I receive? (**sale_rate**)
  - Time range (**_start_time_**, **_end_time_**)
  - Minimum and maximum amount of currency that can be spent (**_min_buy_**, **_max_buy_**).
  - Soft cap and hard cap (**_soft_cap_**, **_hard_cap_**)
  - What do you want to do with the remaining tokens after the pool ends (**burn_unsold_tokens**), true if you want to burn, false if you want to return to the creator.

- User (**_Investor_**) can buy token via launchpool by sending currency to launchpool address.

- User (**_Investor_**) can cancel buy if they want.

- User (**_creator_**) can finalize pool after end time.

- User (**_Investor_**) can claim token after pool finalized.

# How to build?

Run this command in anchor_project folder

```bash
anchor build
```

# How to run test?

```bash
anchor test
```

# How to deploy?

```bash
anchor deploy --provider.cluster https://rpc.devnet.soo.network/rpc
```
