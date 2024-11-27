import { useMutation } from "@tanstack/react-query";
import useLaunchpadProgram from "./useLaunchpadProgram";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { isToken2022 } from "@/lib/utils";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const useMakeBuy = (poolAddress: string) => {
  const { program, wallet } = useLaunchpadProgram();
  return useMutation({
    mutationKey: ["make-buy", poolAddress],
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!program || !wallet) {
        return { success: false, message: "Connect wallet to continue" };
      }
      const poolPublickey = new PublicKey(poolAddress);

      try {
        const pool = await program.account.pool.fetch(poolPublickey);

        const tx = await program.methods
          .buy(new BN(amount * LAMPORTS_PER_SOL))
          .accountsPartial({
            buyer: wallet,
            mint: pool.mint,
            pool: poolPublickey,
            tokenProgram: (await isToken2022(pool.mint))
              ? TOKEN_2022_PROGRAM_ID
              : TOKEN_PROGRAM_ID,
          })
          .rpc();

        return {
          success: true,
          tx,
          message: "Buy successful",
        };
      } catch (error) {
        console.error(error);
        return { success: false, message: "Something went wrong" };
      }
    },
  });
};

export default useMakeBuy;
