"use client";
import useLaunchPools from "@/hooks/useLaunchPools";
import React from "react";
import PoolCard from "./PoolCard";

const PoolGrid = () => {
  const { data, isLoading } = useLaunchPools();
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data?.map((pool) => (
        <PoolCard
          key={pool.publicKey.toBase58()}
          address={pool.publicKey.toBase58()}
          account={pool.account}
        />
      ))}
    </div>
  );
};

export default PoolGrid;
