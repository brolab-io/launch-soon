import { useMutation } from "@tanstack/react-query";
import useLaunchpadProgram from "./useLaunchpadProgram";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { isToken2022 } from "@/lib/utils";
import { BN } from "@coral-xyz/anchor";

type CreateNewLaunchpadData = {
  tokenAddress: string;
  saleRate: number;
  softCap: number;
  hardCap: number;
  minBuy: number;
  maxBuy: number;
  startAt: number;
  endAt: number;
  unsoldTokenBehavior: "refund" | "burn";
};
const useCreateNewLaunchpad = () => {
  const { program, wallet } = useLaunchpadProgram();
  return useMutation({
    mutationKey: ["create-new-launchpad"],
    mutationFn: async (data: CreateNewLaunchpadData) => {
      if (!program || !wallet) {
        return { success: false, message: "Connect wallet to continue" };
      }
      console.log("Creating new launchpad with data", data);
      try {
        const token2022 = await isToken2022(data.tokenAddress);
        const args = {
          saleRate: new BN(data.saleRate),
          startTime: new BN(data.startAt),
          endTime: new BN(data.endAt),
          minBuy: new BN(data.minBuy * LAMPORTS_PER_SOL),
          maxBuy: new BN(data.maxBuy * LAMPORTS_PER_SOL),
          softCap: new BN(data.softCap * LAMPORTS_PER_SOL),
          hardCap: new BN(data.hardCap * LAMPORTS_PER_SOL),
          burnUnsoldTokens: data.unsoldTokenBehavior === "burn",
        };
        const [poolAddress] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("POOL"),
            wallet.toBuffer(),
            new PublicKey(data.tokenAddress).toBuffer(),
          ],
          program.programId
        );
        const tx = await program.methods
          .createPool(args)
          .accounts({
            tokenProgram: token2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
            mint: new PublicKey(data.tokenAddress),
            creator: wallet,
          })
          .rpc({
            commitment: "confirmed",
          });
        return {
          success: true,
          tx,
          poolAddress,
          message: "Launchpad created successfully",
        };
      } catch (error) {
        console.error(error);
        return { success: false, message: "Something went wrong" };
      }
    },
  });
};
export default useCreateNewLaunchpad;
