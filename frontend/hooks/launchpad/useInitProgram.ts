import { useMutation } from "@tanstack/react-query";
import useLaunchpadProgram from "./useLaunchpadProgram";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const useInitProgram = () => {
  const { program, wallet } = useLaunchpadProgram();
  return useMutation({
    mutationKey: ["init-program"],
    mutationFn: async () => {
      if (!program || !wallet) {
        return { success: false, message: "Connect wallet to continue" };
      }
      const FEE_RATE = 500;
      const CREATION_FEE = new BN(100000000);
      const tx = await program.methods
        .initialize(FEE_RATE, CREATION_FEE)
        .accounts({
          signer: wallet,
          feeCollector: new PublicKey(
            "ETUPvv8dG1c6pKzUrN5ChRiqHnVDMq877iUbQWkgKHNp"
          ),
        })
        .rpc();

      return { success: true, tx, message: "Program initialized successfully" };
    },
  });
};

export default useInitProgram;
