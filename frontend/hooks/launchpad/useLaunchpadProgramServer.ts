"use server";
import { LaunchSoon } from "@/lib/contracts/launch_soon";
import { Program } from "@coral-xyz/anchor";
import idl from "@/lib/contracts/launch_soon.json";
import { Connection } from "@solana/web3.js";
import { RPC_URL } from "@/lib/constants";
const useLaunchpadProgramServer = () => {
  const connection = new Connection(RPC_URL);
  const program = new Program<LaunchSoon>(idl as LaunchSoon, { connection });
  return { program, connection };
};

export default useLaunchpadProgramServer;
