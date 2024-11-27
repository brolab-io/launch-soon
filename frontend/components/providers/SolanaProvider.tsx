"use client";
import React, { PropsWithChildren, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { RPC_URL } from "@/lib/constants";

const SolanaProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const wallets = useMemo(() => [], []);
  const endpoint = useMemo(() => RPC_URL, [network]);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaProvider;
