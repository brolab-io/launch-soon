import { useQuery } from "@tanstack/react-query";
import useLaunchpadProgram from "./launchpad/useLaunchpadProgram";

const usePoolInfo = (address: string) => {
  const { program } = useLaunchpadProgram();
  return useQuery({
    queryKey: ["pool", address],
    queryFn: async () => {
      return program.account.pool.fetch(address);
    },
  });
};

export default usePoolInfo;
