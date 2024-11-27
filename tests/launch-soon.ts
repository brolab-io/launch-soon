import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { LaunchSoon } from "../target/types/launch_soon";
import { getConfigAccount, getPoolAccount, getTreasurerAccount } from "./utils";
import { assert, expect } from "chai";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import dayjs from "dayjs";
describe("launch-soon", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LaunchSoon as Program<LaunchSoon>;
  const createNewPoolEventSubscriptionId = program.addEventListener(
    "createNewPoolEvent",
    (event) => {
      console.log("createNewPoolEvent", event);
    }
  );

  const finalizePoolEventSubscriptionId = program.addEventListener(
    "poolFinalizedEvent",
    (event) => {
      console.log("finalizePoolEvent", event);
    }
  );

  const claimTokenEventSubscriptionId = program.addEventListener(
    "claimEvent",
    (event) => {
      console.log("claimTokenEvent", event);
    }
  );

  const cancelBuyEventSubscriptionId = program.addEventListener(
    "cancelBuyEvent",
    (event) => {
      console.log("cancelBuyEvent", event);
    }
  );

  const buyEventSubscriptionId = program.addEventListener(
    "buyEvent",
    (event) => {
      console.log("buyEvent", event);
    }
  );

  const [creator, user1, user2, feeCollector] = [
    anchor.web3.Keypair.generate(),
    anchor.web3.Keypair.generate(),
    anchor.web3.Keypair.generate(),
    anchor.web3.Keypair.generate(),
  ];

  const mintKeypair = anchor.web3.Keypair.generate();

  const FEE_RATE = 500;
  const CREATION_FEE = new BN(100000000);

  let creatorTokenAccount;

  const minBuy = new BN(0.2 * web3.LAMPORTS_PER_SOL);
  const maxBuy = new BN(0.5 * web3.LAMPORTS_PER_SOL);
  const softCap = new BN(1.5 * web3.LAMPORTS_PER_SOL);
  const hardCap = new BN(2.5 * web3.LAMPORTS_PER_SOL);

  before(async () => {
    {
      const tx = await provider.connection.requestAirdrop(
        creator.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(tx);

      const tx2 = await provider.connection.requestAirdrop(
        user1.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(tx2);

      const tx3 = await provider.connection.requestAirdrop(
        user2.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(tx3);

      // const tx4 = await provider.connection.requestAirdrop(
      //   feeCollector.publicKey,
      //   1 * anchor.web3.LAMPORTS_PER_SOL
      // );
      // await provider.connection.confirmTransaction(tx4);
    }
    {
      // init token for test to poolAuthor
      const mint = await createMint(
        provider.connection,
        creator,
        creator.publicKey,
        null,
        7,
        mintKeypair,
        null,
        TOKEN_2022_PROGRAM_ID
      );

      creatorTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        creator,
        mint,
        creator.publicKey,
        false,
        null,
        null,
        TOKEN_2022_PROGRAM_ID
      );

      await mintTo(
        provider.connection,
        creator,
        mint,
        creatorTokenAccount.address,
        creator,
        BigInt(1_000_000_000 * 10 ** 7),
        [],
        null,
        TOKEN_2022_PROGRAM_ID
      );
    }
  });

  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize(FEE_RATE, CREATION_FEE)
      .accounts({
        signer: provider.wallet.publicKey,
        feeCollector: feeCollector.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    const configAccount = getConfigAccount(program.programId);
    const configAccountData = await program.account.config.fetch(
      configAccount[0]
    );
    expect(configAccountData.feeRate).eq(FEE_RATE);
    expect(configAccountData.authority.toBase58()).eq(
      provider.wallet.publicKey.toBase58()
    );
    expect(configAccountData.bump).eq(configAccount[1]);
  });

  it("Is not initialized twice!", async () => {
    try {
      await program.methods
        .initialize(FEE_RATE, CREATION_FEE)
        .accounts({
          signer: provider.wallet.publicKey,
          feeCollector: feeCollector.publicKey,
        })
        .rpc();
    } catch (err) {
      expect(err).is.not.null;
    }
  });

  it("Create a pool successfully!", async () => {
    const args = {
      saleRate: new BN(1000),
      startTime: new BN(dayjs().add(1, "s").unix()),
      endTime: new BN(dayjs().add(5, "s").unix()),
      minBuy,
      maxBuy,
      softCap,
      hardCap,
      burnUnsoldTokens: false,
    };

    const poolAccount = getPoolAccount(
      creator.publicKey,
      mintKeypair.publicKey,
      program.programId
    );

    const tx = await program.methods
      .createPool(args)
      .accounts({
        creator: creator.publicKey,
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();
    console.log("Your transaction signature", tx);

    const poolAccountData = await program.account.pool.fetch(poolAccount[0]);

    expect(poolAccountData.authority.toBase58()).eq(
      creator.publicKey.toBase58()
    );
    expect(poolAccountData.mint.toBase58()).eq(
      mintKeypair.publicKey.toBase58()
    );
    assert(poolAccountData.saleRate.eq(args.saleRate));
    assert(poolAccountData.startTime.eq(args.startTime));
    assert(poolAccountData.endTime.eq(args.endTime));
    assert(poolAccountData.minBuy.eq(args.minBuy));
    assert(poolAccountData.maxBuy.eq(args.maxBuy));
    assert(poolAccountData.softCap.eq(args.softCap));
    assert(poolAccountData.hardCap.eq(args.hardCap));
    assert(poolAccountData.burnUnsoldTokens === args.burnUnsoldTokens);

    const feeCollectorBalance = await provider.connection.getBalance(
      feeCollector.publicKey
    );
    expect(feeCollectorBalance).eq(CREATION_FEE.toNumber());
  });

  it("User buy with wrong min amount will fail!", async () => {
    try {
      const poolAccount = getPoolAccount(
        creator.publicKey,
        mintKeypair.publicKey,
        program.programId
      );
      await program.methods
        .buy(minBuy.sub(new BN(1)))
        .accountsPartial({
          buyer: user1.publicKey,
          pool: poolAccount[0],
          mint: mintKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
    } catch (err) {
      expect(err).is.not.null;
    }
  });

  it("User can buy token successfully!", async () => {
    // delay 2s to make sure the pool is created
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const poolAccount = getPoolAccount(
      creator.publicKey,
      mintKeypair.publicKey,
      program.programId
    );
    const tx = await program.methods
      .buy(new BN(0.2 * web3.LAMPORTS_PER_SOL))
      .accountsPartial({
        buyer: user1.publicKey,
        pool: poolAccount[0],
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    console.log("Your transaction signature", tx);

    await program.methods
      .buy(new BN(0.5 * web3.LAMPORTS_PER_SOL))
      .accountsPartial({
        buyer: user2.publicKey,
        pool: poolAccount[0],
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([user2])
      .rpc();
  });

  it("User buy with wrong max amount will fail!", async () => {
    try {
      const poolAccount = getPoolAccount(
        creator.publicKey,
        mintKeypair.publicKey,
        program.programId
      );
      await program.methods
        .buy(maxBuy.add(new BN(1)))
        .accountsPartial({
          buyer: user1.publicKey,
          pool: poolAccount[0],
          mint: mintKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
    } catch (err) {
      expect(err).is.not.null;
    }
  });

  it("User cancel buy token successfully!", async () => {
    // delay 1s to make sure the pool is created
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const poolAccount = getPoolAccount(
      creator.publicKey,
      mintKeypair.publicKey,
      program.programId
    );
    const tx = await program.methods
      .cancelBuy()
      .accountsPartial({
        buyer: user2.publicKey,
        pool: poolAccount[0],
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([user2])
      .rpc();

    console.log("Your transaction signature", tx);
  });

  it("User can't claim token before finalize!", async () => {
    try {
      const poolAccount = getPoolAccount(
        creator.publicKey,
        mintKeypair.publicKey,
        program.programId
      );
      await program.methods
        .claim()
        .accountsPartial({
          buyer: user1.publicKey,
          pool: poolAccount[0],
          mint: mintKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
    } catch (err) {
      expect(err).is.not.null;
    }
  });

  it("Finalize a pool successfully!", async () => {
    const feeCollectorBalanceBefore = await provider.connection.getBalance(
      feeCollector.publicKey
    );

    const creatorBalanceBefore = await provider.connection.getBalance(
      creator.publicKey
    );

    const poolAccount = getPoolAccount(
      creator.publicKey,
      mintKeypair.publicKey,
      program.programId
    );

    const treasurerAccount = getTreasurerAccount(
      poolAccount[0],
      program.programId
    );

    const treasurerBalanceBefore = await provider.connection.getBalance(
      treasurerAccount[0]
    );
    // delay 5s to make sure the pool is can be finalized
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const tx = await program.methods
      .finalizePool()
      .accounts({
        creator: creator.publicKey,
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    console.log("Your transaction signature", tx);

    const feeCollectorBalanceAfter = await provider.connection.getBalance(
      feeCollector.publicKey
    );

    const fee = (treasurerBalanceBefore * FEE_RATE) / 10000;
    expect(feeCollectorBalanceAfter).eq(feeCollectorBalanceBefore + fee);

    const creatorBalanceAfter = await provider.connection.getBalance(
      creator.publicKey
    );

    expect(creatorBalanceAfter).eq(
      creatorBalanceBefore + (treasurerBalanceBefore - fee)
    );
  });

  it("User can't buy token after finalize!", async () => {
    try {
      const poolAccount = getPoolAccount(
        creator.publicKey,
        mintKeypair.publicKey,
        program.programId
      );
      await program.methods
        .buy(new BN(web3.LAMPORTS_PER_SOL))
        .accountsPartial({
          buyer: user2.publicKey,
          pool: poolAccount[0],
          mint: mintKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();
    } catch (err) {
      expect(err).is.not.null;
    }
  });

  it("User can't cancel buy token after finalize!", async () => {
    try {
      const poolAccount = getPoolAccount(
        creator.publicKey,
        mintKeypair.publicKey,
        program.programId
      );
      await program.methods
        .cancelBuy()
        .accountsPartial({
          buyer: user1.publicKey,
          pool: poolAccount[0],
          mint: mintKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
    } catch (err) {
      expect(err).is.not.null;
    }
  });

  it("User can claim token successfully!", async () => {
    const poolAccount = getPoolAccount(
      creator.publicKey,
      mintKeypair.publicKey,
      program.programId
    );
    const tx = await program.methods
      .claim()
      .accountsPartial({
        buyer: user1.publicKey,
        pool: poolAccount[0],
        mint: mintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    console.log("Your transaction signature", tx);
  });

  after(() => {
    program.removeEventListener(createNewPoolEventSubscriptionId);
    program.removeEventListener(finalizePoolEventSubscriptionId);
    program.removeEventListener(claimTokenEventSubscriptionId);
    program.removeEventListener(cancelBuyEventSubscriptionId);
    program.removeEventListener(buyEventSubscriptionId);
  });
});
