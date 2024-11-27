"use client";
import React from "react";
import { Card, CardContent } from "./ui/card";
import { Heart } from "lucide-react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { fromUnixTime, getUnixTime, isAfter, isBefore } from "date-fns";
import { NATIVE_CURRENCY } from "@/lib/utils";
import usePoolStatus from "@/hooks/usePoolStatus";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
type Props = {
  address: string;
  account: {
    authority: PublicKey;
    mint: PublicKey;
    saleRate: BN;
    startTime: BN;
    endTime: BN;
    minBuy: BN;
    maxBuy: BN;
    softCap: BN;
    hardCap: BN;
    unsoldTokens: BN;
    burnUnsoldTokens: boolean;
    finalized: boolean;
    bump: number;
    treasurerBump: number;
  };
};

const PoolCard: React.FC<Props> = ({ address, account: pool }) => {
  const { data } = usePoolStatus(address);
  console.log(data)
  if (!data) {
    return null;
  }

  const {
    raisedPercent,
    currentRaised,
    totalPresale,
    metadata,
    jsonUri,
    mint,
  } = data;
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <Avatar className="size-12 bg-gray-100 p-1">
              <AvatarImage src={jsonUri.image} />
              <AvatarFallback>{jsonUri.symbol}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold uppercase">{metadata.symbol}</h3>
              <p className="text-sm text-muted-foreground">
                1 {NATIVE_CURRENCY} = {Number(pool.saleRate).toLocaleString()}{" "}
                {metadata.symbol}
              </p>
            </div>
          </div>
          {isAfter(Number(pool.startTime), getUnixTime(new Date())) ? (
            <Badge variant="secondary">Not Started</Badge>
          ) : isBefore(Number(pool.endTime), getUnixTime(new Date())) ? (
            <Badge variant="destructive">Ended</Badge>
          ) : (
            <Badge variant="default">Active</Badge>
          )}
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Target</span>
            <span>
              {(pool.hardCap / LAMPORTS_PER_SOL).toLocaleString()}{" "}
              {NATIVE_CURRENCY}
            </span>
          </div>
          <Progress value={raisedPercent} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>
              {(currentRaised / LAMPORTS_PER_SOL).toLocaleString()}{" "}
              {NATIVE_CURRENCY} Raised
            </span>
            <span>({raisedPercent.toFixed(2)}%)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Token presale</span>
            <span>
              {totalPresale.toLocaleString()} {metadata.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Remaining tokens</span>
            <span>
              {Number(pool.unsoldTokens / 10 ** mint.decimals).toLocaleString()}{" "}
              {metadata.symbol}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm">
            <div>Sale Starts At</div>
            <div>{fromUnixTime(pool.startTime).toLocaleString()}</div>
          </div>
          <div className="flex gap-2">
            <Link href={`/pool/${address}`}>
              <Button>View</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PoolCard;
