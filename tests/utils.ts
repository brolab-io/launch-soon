import { web3 } from "@coral-xyz/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
export function getConfigAccount(programId: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("CONFIG")],
    programId
  );
}

export function getPoolAccount(
  creator: web3.PublicKey,
  mint: web3.PublicKey,
  programId: web3.PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("POOL"), creator.toBuffer(), mint.toBuffer()],
    programId
  );
}

export function getTreasurerAccount(
  pool: web3.PublicKey,
  programId: web3.PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("TREASURER"), pool.toBuffer()],
    programId
  );
}

export function associatedAddress(mint: web3.PublicKey, owner: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_PROGRAM_ID
  )[0];
}
