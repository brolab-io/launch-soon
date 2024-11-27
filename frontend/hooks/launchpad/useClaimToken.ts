import { useMutation } from "@tanstack/react-query";
import useLaunchpadProgram from "./useLaunchpadProgram";
import { PublicKey } from "@solana/web3.js";
import { isToken2022 } from "@/lib/utils";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const useClaimToken = (address: string) => {
  const { program, wallet } = useLaunchpadProgram();
  return useMutation({
    mutationKey: ["claim-token", address],
    mutationFn: async () => {
      if (!program || !wallet) {
        return { success: false, message: "Connect wallet to continue" };
      }
      const poolPublickey = new PublicKey(address);
      try {
        const pool = await program.account.pool.fetch(poolPublickey);

        const tx = await program.methods
          .claim()
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
          message: "Claim successful",
        };
      } catch (error) {
        console.error(error);
        return { success: false, message: "Something went wrong" };
      }
    },
  });
};

export default useClaimToken;
