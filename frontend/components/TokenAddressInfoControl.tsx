"use client";
import React, { useCallback, useEffect } from "react";
import { Control, useWatch } from "react-hook-form";
import { FormSchemaType } from "./LaunchpadForm";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ParsedAccountData, PublicKey } from "@solana/web3.js";
import useUmi from "@/hooks/useUmi";
import { fetchDigitalAsset } from "@metaplex-foundation/mpl-token-metadata";
import { isPublicKey, publicKey } from "@metaplex-foundation/umi";
import { Separator } from "./ui/separator";
import { Loader2Icon } from "lucide-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
type Props = {
  control: Control<FormSchemaType>;
};
const TokenAddressInfoControl: React.FC<Props> = ({ control }) => {
  const { publicKey: wallet } = useWallet();
  const [loading, setLoading] = React.useState(false);
  const [tokenInfo, setTokenInfo] = React.useState({
    name: "",
    symbol: "",
    decimals: 0,
    supply: 0,
  });
  const [tokenBalance, setTokenBalance] = React.useState(0);
  const { connection } = useConnection();
  const umi = useUmi();
  const tokenAddress = useWatch({
    control,
    name: "tokenAddress",
    defaultValue: "",
  });

  const getTokenInfo = useCallback(async () => {
    if (!tokenAddress || !isPublicKey(tokenAddress)) return;
    setLoading(true);

    try {
      const { metadata, mint } = await fetchDigitalAsset(
        umi,
        publicKey(tokenAddress)
      );
      setTokenInfo({
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: mint.decimals,
        supply: Number(mint.supply / BigInt(10 ** mint.decimals)),
      });
    } catch (error) {
      const { value } = await connection.getParsedAccountInfo(
        new PublicKey(tokenAddress)
      );

      if (value) {
        const mintInfo = (value.data as ParsedAccountData).parsed.info;
        console.log("mint", mintInfo);
        setTokenInfo({
          name: "",
          symbol: "",
          decimals: mintInfo.decimals,
          supply: Number(
            BigInt(mintInfo.supply) / BigInt(10 ** mintInfo.decimals)
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  const getTokenBalance = useCallback(async () => {
    if (!isPublicKey(tokenAddress) || !tokenInfo || !wallet) return;
    const tokenAccount = getAssociatedTokenAddressSync(
      new PublicKey(tokenAddress),
      wallet
    );
    try {
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      setTokenBalance(balance.value.uiAmount || 0);
    } catch (error) {
      setTokenBalance(0);
    }
  }, [tokenInfo]);

  useEffect(() => {
    getTokenInfo();
  }, [tokenAddress]);

  useEffect(() => {
    getTokenBalance();
  }, [tokenInfo]);

  if (!tokenAddress || !isPublicKey(tokenAddress)) return null;

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground flex flex-col justify-center items-center space-y-2">
        <Loader2Icon className="animate-spin" />
        <span>Fetching token info ...</span>
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      <ul className="space-y-2">
        <li className="flex justify-between">
          <span>Name:</span> {tokenInfo.name}
        </li>
        <Separator />
        <li className="flex justify-between">
          <span>Symbol:</span> {tokenInfo.symbol}
        </li>
        <Separator />
        <li className="flex justify-between">
          <span>Total supply:</span> {tokenInfo.supply.toLocaleString()}
        </li>
        <Separator />
        <li className="flex justify-between">
          <span>Decimals:</span> {tokenInfo.decimals}
        </li>
        {tokenBalance ? (
          <>
            <Separator />
            <li className="flex justify-between">
              <span>Your balance:</span> {tokenBalance.toLocaleString()}
            </li>
          </>
        ) : null}
      </ul>
    </div>
  );
};

export default TokenAddressInfoControl;
