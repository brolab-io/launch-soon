import { web3 } from "@coral-xyz/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import MerkleTree from "merkletreejs";
import { keccak_256 } from "@noble/hashes/sha3";

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

type MerkleTreeInput = Uint8Array | string;

export const getMerkleTree = (data: MerkleTreeInput[]): MerkleTree => {
  return new MerkleTree(data.map(keccak_256), keccak_256, {
    sortPairs: true,
  });
};

export const getMerkleRoot = (data: MerkleTreeInput[]): Uint8Array => {
  return getMerkleTree(data).getRoot();
};

export const getMerkleProof = (
  data: MerkleTreeInput[],
  leaf: MerkleTreeInput,
  index?: number
): Uint8Array[] => {
  return getMerkleTree(data)
    .getProof(Buffer.from(keccak_256(leaf)), index)
    .map((proofItem) => proofItem.data);
};

export const allowAddresses = [
  "63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs",
  "5AHKzmDcjeAAnafTivi5u7dWYw3jUQh2VBRDzSd9ztVr",
  "CDXLgstdVZJ7qUh3DC1mAGuCmTM3UiS1M24m44t3UViS",
  "3hZu5KH5CSAtnfERxbKnFMTRy1VwPkyEphkm2PRfZjTB",
  "6Bs6sz85RQtBVRsnsH11qSxmuR326S5jguEQVK7T73NJ",
];
