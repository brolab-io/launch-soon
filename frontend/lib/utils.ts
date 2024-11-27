import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RPC_URL } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NATIVE_CURRENCY = "SOL";

export function ellipsify(str = "", len = 4) {
  if (str.length > 10) {
    return (
      str.substring(0, len) + ".." + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export const isToken2022 = async (mint: PublicKey | string) => {
  const connection = new Connection(RPC_URL);
  const mintInfo = await connection.getAccountInfo(new PublicKey(mint));
  return mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID);
};

export const getMintInfo = async (mint: PublicKey | string) => {
  const connection = new Connection(RPC_URL);
  const tokenProgram = (await isToken2022(mint))
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;

  return getMint(connection, new PublicKey(mint), undefined, tokenProgram);
};

export const getExplorerUrl = (
  type: "address" | "tx" = "tx",
  hash: string,
  cluster: string = "devnet"
) => {
  return `https://explorer.${cluster}.soo.network/${type}/${hash}`;
};

export const transformIrysUrl = (url: string) => {
  return url.replace("arweave.net/", "gateway.irys.xyz/");
};
