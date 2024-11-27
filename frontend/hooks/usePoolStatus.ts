import { useQuery } from "@tanstack/react-query";
import useLaunchpadProgram from "./launchpad/useLaunchpadProgram";
import useUmi from "./useUmi";
import {
  fetchDigitalAsset,
  fetchJsonMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { transformIrysUrl } from "@/lib/utils";

const usePoolStatus = (address: string) => {
  const { program } = useLaunchpadProgram();
  const umi = useUmi();
  return useQuery({
    queryKey: ["pool-status", address],
    queryFn: async () => {
      const pool = await program.account.pool.fetch(address);

      const { metadata, mint } = await fetchDigitalAsset(
        umi,
        publicKey(pool.mint),
        {
          commitment: "confirmed",
        }
      );

      const jsonUri = await fetchJsonMetadata(
        umi,
        transformIrysUrl(metadata.uri)
      );
      const totalPresale = (pool.hardCap * pool.saleRate) / 10 ** 9;

      const raisedPercent = (pool.raised / pool.hardCap) * 100;

      return {
        mint,
        pool,
        metadata,
        jsonUri,
        totalPresale,
        currentRaised: pool.raised,
        raisedPercent,
      };
    },
  });
};

export default usePoolStatus;
