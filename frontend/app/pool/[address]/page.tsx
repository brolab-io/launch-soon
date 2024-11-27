import PoolAction from "@/components/PoolAction";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import useLaunchpadProgramServer from "@/hooks/launchpad/useLaunchpadProgramServer";
import useUmiServer from "@/hooks/useUmiServer";
import { getExplorerUrl, NATIVE_CURRENCY, transformIrysUrl } from "@/lib/utils";
import {
  fetchDigitalAsset,
  fetchJsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { fromUnixTime, getUnixTime, isAfter, isBefore } from "date-fns";
import React from "react";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ address: string }>;
};

const getData = async (address: string) => {
  const { program, connection } = useLaunchpadProgramServer();
  const umi = useUmiServer();
  const pool = await program.account.pool.fetch(address);

  const { metadata, mint } = await fetchDigitalAsset(
    umi,
    publicKey(pool.mint),
    {
      commitment: "confirmed",
    }
  );

  const jsonUri = await fetchJsonMetadata(umi, transformIrysUrl(metadata.uri));
  const totalPresale = (pool.hardCap * pool.saleRate) / 10 ** 9;

  const raisedPercent = (pool.raised / pool.hardCap) * 100;

  return {
    pool,
    metadata,
    mint,
    totalPresale,
    currentRaised: pool.raised,
    raisedPercent,
    jsonUri,
  };
};

const PoolDetailPage: React.FC<Props> = async ({ params }) => {
  const { address } = await params;
  const {
    pool,
    metadata,
    mint,
    totalPresale,
    currentRaised,
    raisedPercent,
    jsonUri,
  } = await getData(address);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-10">
      <div className="z-10 w-full container mx-auto items-center justify-between lg:flex">
        <div className="container mx-auto p-4 max-w-3xl">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={jsonUri.image} />
                  <AvatarFallback>{jsonUri.symbol}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{metadata.name}</h1>
                  {isAfter(Number(pool.startTime), getUnixTime(new Date())) ? (
                    <Badge variant="secondary">Not Started</Badge>
                  ) : isBefore(
                      Number(pool.endTime),
                      getUnixTime(new Date())
                    ) ? (
                    <Badge variant="destructive">Ended</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />
              <div>
                <h2 className="font-semibold mb-4">Token Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span>
                      <a
                        target="_blank"
                        href={getExplorerUrl("address", mint.publicKey)}
                        className="text-primary"
                      >
                        {mint.publicKey}
                      </a>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol</span>
                    <span className="uppercase">{metadata.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decimals</span>
                    <span>{mint.decimals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Supply</span>
                    <span>
                      {(
                        mint.supply / BigInt(10 ** mint.decimals)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-semibold mb-4">Pool Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <a
                      target="_blank"
                      href={getExplorerUrl("address", address)}
                      className="text-primary"
                    >
                      {address}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Presale Rate</span>
                    <span className="uppercase">
                      1 {NATIVE_CURRENCY} ={" "}
                      {Number(pool.saleRate).toLocaleString()} {metadata.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tokens For Presale
                    </span>
                    <span>
                      {totalPresale.toLocaleString()} {metadata.symbol}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Soft Cap</span>
                    <span>
                      {(pool.softCap / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                      {NATIVE_CURRENCY}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hard Cap</span>
                    <span>
                      {(pool.hardCap / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                      {NATIVE_CURRENCY}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min buy</span>
                    <span>
                      {(pool.minBuy / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                      {NATIVE_CURRENCY}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max buy</span>
                    <span>
                      {(pool.maxBuy / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                      {NATIVE_CURRENCY}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start time</span>
                    <span>{new Date().toLocaleString()}</span>
                    <span>{fromUnixTime(pool.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End time</span>
                    <span>{fromUnixTime(pool.endTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unsold Tokens</span>
                    <span>
                      {Number(
                        pool.unsoldTokens / 10 ** mint.decimals
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Raised</span>
                  <span>
                    {(currentRaised / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                    {NATIVE_CURRENCY} ({raisedPercent.toFixed(2)}%)
                  </span>
                </div>
                <Progress value={raisedPercent} className="h-2 " />
                <div className="flex justify-between items-center">
                  <span>
                    {(currentRaised / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                    {NATIVE_CURRENCY}
                  </span>
                  <span>
                    {(pool.hardCap / LAMPORTS_PER_SOL).toLocaleString()}{" "}
                    {NATIVE_CURRENCY}
                  </span>
                </div>
              </div>

              <PoolAction address={address} />

              {/* <div className="space-y-4">
                <div>
                  <h2 className="font-semibold mb-4">Token Distribution</h2>
                  <div className="aspect-square max-w-[200px] mx-auto">
                    <PieChart
                      data={distributionData}
                      lineWidth={40}
                      paddingAngle={2}
                      label={({ dataEntry }) => `${dataEntry.value}%`}
                      labelStyle={{ fontSize: "8px", fill: "white" }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    {distributionData.map((item) => (
                      <div key={item.title} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>
                          {item.title}: {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default PoolDetailPage;
