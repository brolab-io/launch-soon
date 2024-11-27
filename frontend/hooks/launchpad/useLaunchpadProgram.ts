import { LaunchSoon } from "@/lib/contracts/launch_soon";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import idl from "@/lib/contracts/launch_soon.json";
const useLaunchpadProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const provider = new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
  const program = new Program<LaunchSoon>(idl as LaunchSoon, provider);
  return { program, provider, wallet: wallet.publicKey };
};

export default useLaunchpadProgram;
