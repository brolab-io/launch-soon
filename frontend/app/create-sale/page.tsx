import LaunchpadForm from "@/components/LaunchpadForm";
import React from "react";

const CreateSalePage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-10">
      <div className="z-10 w-full container mx-auto items-center justify-between lg:flex">
        <LaunchpadForm />
      </div>
    </main>
  );
};

export default CreateSalePage;
