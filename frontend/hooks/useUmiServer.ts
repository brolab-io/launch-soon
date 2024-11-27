"use server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { RPC_URL } from "@/lib/constants";

const useUmiServer = () => {
  const umi = createUmi(RPC_URL, {
    commitment: "confirmed",
  }).use(mplTokenMetadata());

  return umi;
};

export default useUmiServer;
