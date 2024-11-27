"use client";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { useMemo } from "react";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  Cluster,
  createNoopSigner,
  generateSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { useWallet } from "@solana/wallet-adapter-react";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { RPC_URL } from "@/lib/constants";

const useUmi = () => {
  const wallet = useWallet();
  const endpoint = useMemo(() => RPC_URL, []);
  // Create Umi instance
  const umi = createUmi(endpoint, {
    commitment: "confirmed",
  }).use(mplTokenMetadata());

  umi.programs.add({
    name: "mplTokenMetadata",
    publicKey: publicKey("6C4GR9AtMGF25sjXKtdB7A6NVQUudEQWw97kG61pGuA1"),
    getErrorFromCode: (code: number, cause?: Error) => null,
    getErrorFromName: (name: string, cause?: Error) => null,
    isOnCluster: (cluster: Cluster) => true,
  },
    true)

  if (wallet) {
    umi.use(walletAdapterIdentity(wallet));
  } else {
    umi.use(signerIdentity(createNoopSigner(generateSigner(umi).publicKey)));
  }

  return umi;
};

export default useUmi;
