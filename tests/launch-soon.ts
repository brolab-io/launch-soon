import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LaunchSoon } from "../target/types/launch_soon";

describe("launch-soon", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.LaunchSoon as Program<LaunchSoon>;
  const FEE = 100;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize(FEE).rpc();
    console.log("Your transaction signature", tx);
  });
});
