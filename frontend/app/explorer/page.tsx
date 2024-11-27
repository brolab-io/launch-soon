import PoolGrid from "@/components/PoolGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid, Heart, List } from "lucide-react";
import React from "react";

const ExplorerPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-10">
      <div className="z-10 w-full container items-center justify-between text-sm space-y-5">
        <h1 className="text-2xl font-bold">Launchpads</h1>

        <div className="flex flex-wrap gap-4">
          <Button variant="default">All</Button>
          <Button variant="ghost">Ended</Button>
          <Button variant="ghost">My Contributions</Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Type token symbol, address to find your launchpad"
            className="flex-1 min-w-[300px]"
          />
          <div className="flex gap-2 flex-wrap">
            <Select defaultValue="all-status">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="no-sort">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-sort">No Sort</SelectItem>
                <SelectItem value="hard-cap">Hard Cap</SelectItem>
                <SelectItem value="soft-cap">Soft Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <PoolGrid />
      </div>
    </main>
  );
};

export default ExplorerPage;
