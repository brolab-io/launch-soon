"use client";
import { Button } from "@/components/ui/button";
import useInitProgram from "@/hooks/launchpad/useInitProgram";
import React from "react";

const ContractPage = () => {
  const { mutateAsync } = useInitProgram();
  return (
    <div>
      <Button onClick={() => mutateAsync()}>Init Program</Button>
    </div>
  );
};

export default ContractPage;
