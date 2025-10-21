import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as assert from "assert";

describe("counter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.counter as Program<Counter>;
  const user = anchor.web3.Keypair.generate();
  let counterPDA: anchor.web3.PublicKey;

  before(async () => {
    // airdrop some SOL to user
    await airdrop(user.publicKey);
    [counterPDA] = getCounterAddress(user.publicKey, program.programId);
  });

  it("Is initialized!", async () => {
    await program.methods
      .initialize()
      .accounts({
        authority: user.publicKey,
        counter: counterPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
      const initCount = await program.account.counter.fetch(counterPDA);
      assert.ok(initCount.count.toNumber() === 0);
  });

  it("Is incremented!", async () => {
    // get count before increment
    const countBefore = await program.account.counter.fetch(counterPDA);

    await program.methods.increment().accounts({
      authority: user.publicKey,
      counter: counterPDA,
    })
    .signers([user])
    .rpc();

    // get count after increment
    const countAfter = await program.account.counter.fetch(counterPDA);

    // count must have increased
    assert.ok(countAfter.count.toNumber() > countBefore.count.toNumber());
  });

  it("Is decremented!", async () => {
    // get count before decrement
    const countBefore = await program.account.counter.fetch(counterPDA);

    await program.methods.decrement().accounts({
      authority: user.publicKey,
      counter: counterPDA,
    })
    .signers([user])
    .rpc();

    // get count after decrement
    const countAfter = await program.account.counter.fetch(counterPDA);

    // count must have decreased
    assert.ok(countAfter.count.toNumber() < countBefore.count.toNumber());
  });

  // function to airdrop 1 SOL to a user
  const airdrop = async (publicKey: anchor.web3.PublicKey) => {
    const sig = await program.provider.connection.requestAirdrop(
      publicKey,
      1_000_000_000 // 1 SOL
    );
    await program.provider.connection.confirmTransaction(sig, "confirmed");
  };

  // returns PDA of account
  const getCounterAddress = (
    authority: PublicKey,
    programID: PublicKey,
  ) => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("counter"),
        authority.toBuffer(),
      ],
      programID,
    );
  };
});
