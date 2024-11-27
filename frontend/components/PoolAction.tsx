"use client";

import React, { useCallback } from "react";
import usePoolInfo from "@/hooks/usePoolInfo";
import BuyForm from "./BuyForm";
import { getUnixTime, isAfter, isBefore } from "date-fns";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "./ui/button";
import useFinalizePool from "@/hooks/launchpad/useFinalizePool";
import { toast } from "react-toastify";
import { getExplorerUrl } from "@/lib/utils";
import useClaimToken from "@/hooks/launchpad/useClaimToken";

type Props = {
  address: string;
};

const PoolAction: React.FC<Props> = ({ address }) => {
  const { publicKey } = useWallet();
  const { data: pool } = usePoolInfo(address);
  const { mutateAsync: mutateFinalize } = useFinalizePool(address);
  const { mutateAsync: mutateClaim } = useClaimToken(address);

  const handleFinalize = useCallback(async () => {
    await toast.promise(mutateFinalize(), {
      pending: "Finalizing pool...",
      success: {
        render({ data }) {
          return (
            <div>
              <p>{data.message}</p>
              {data.success ? (
                <a
                  target="_blank"
                  className="text-sm text-green-500"
                  href={getExplorerUrl("tx", data.tx as string)}
                >
                  View transaction
                </a>
              ) : null}
            </div>
          );
        },
      },
      error: "Failed to finalize pool",
    });
  }, [mutateFinalize]);

  const handleClaim = useCallback(async () => {
    await toast.promise(mutateClaim(), {
      pending: "Claiming tokens...",
      success: {
        render({ data }) {
          return (
            <div>
              <p>{data.message}</p>
              {data.success ? (
                <a
                  target="_blank"
                  className="text-sm text-green-500"
                  href={getExplorerUrl("tx", data.tx as string)}
                >
                  View transaction
                </a>
              ) : null}
            </div>
          );
        },
      },
      error: "Failed to claim tokens",
    });
  }, [mutateClaim]);

  if (!pool) return null;
  if (isAfter(Number(pool.startTime), getUnixTime(new Date()))) {
    return (
      <div className="text-center">
        <span className="text-sm text-orange-500">Waiting for pool start</span>
      </div>
    );
  }
  if (isBefore(Number(pool.endTime), getUnixTime(new Date()))) {
    return (
      <div className="text-center space-y-4">
        <span className="text-sm text-red-500">
          {pool.finalized
            ? "This pool has been finalized"
            : "This pool has been ended"}
        </span>

        <div>
          {!publicKey ? null : pool.authority.equals(
              new PublicKey(publicKey)
            ) ? (
            <>
              {!pool.finalized ? (
                <Button onClick={handleFinalize}>Finalize pool</Button>
              ) : null}
            </>
          ) : (
            <>
              <Button>Claim</Button>
            </>
          )}
        </div>
      </div>
    );
  }
  return <BuyForm max={pool.maxBuy} min={pool.minBuy} poolAddress={address} />;
};

export default PoolAction;
