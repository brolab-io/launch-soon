import { useQuery } from "@tanstack/react-query";
import useLaunchpadProgram from "./launchpad/useLaunchpadProgram";

const useLaunchPools = () => {
  const { program } = useLaunchpadProgram();
  return useQuery({
    queryKey: ["launchpools"],
    queryFn: async () => {
      return program.account.pool.all();
    },
  });
};

export default useLaunchPools;
