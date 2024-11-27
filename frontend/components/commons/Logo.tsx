import { CannabisIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  isMobile?: boolean;
};

const Logo: React.FC<Props> = ({ isMobile }) => {
  return (
    <Link href="/" className="flex items-center gap-2">
      {!isMobile ? (
        <CannabisIcon className="stroke size-8 stroke-green-500 stroke-[1.5]" />
      ) : null}
      <p className="bg-gradient-to-r from-green-500 via-yellow-500 to-pink-500 bg-clip-text text-2xl font-bold leading-tight tracking-tighter text-transparent">
        Cannabis Sale
      </p>
    </Link>
  );
};

export default Logo;
