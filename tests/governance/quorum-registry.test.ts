import { describe, it, expect, beforeAll, afterEach } from "@jest/globals";
import { createPrivateKey, sign as nodeSign } from "node:crypto";
import {
  registerSigner,
  getGovernanceStage,
  getQuorumConfig,
  verifyAggregatedSignature,
  _resetSignersForTest,
  GovernanceStage,
  type RegisteredSigner,
  type AggregatedSignature,
} from "../../lib/governance/quorum-registry";
import { generateKeyPair } from "../../lib/governance/signed-registry";

// ── SPKI wrapper (same as the governance modules) ─────────────────────────

function wrapPrivateKey(raw32: Uint8Array): Buffer {
  const pkcs8 = Buffer.alloc(48);
  pkcs8[0] = 0x30; pkcs8[1] = 0x2e;
  pkcs8[2] = 0x02; pkcs8[3] = 0x01; pkcs8[4] = 0x00;
  pkcs8[5] = 0x30; pkcs8[6] = 0x05; pkcs8[7] = 0x06;
  pkcs8[8] = 0x03; pkcs8[9] = 0x2b; pkcs8[10] = 0x65; pkcs8[11] = 0x70;
  pkcs8[12] = 0x04; pkcs8[13] = 0x22; pkcs8[14] = 0x04; pkcs8[15] = 0x20;
  Buffer.from(raw32).copy(pkcs8, 16);
  return pkcs8;
}

function signWithKey(message: Uint8Array, privateKey: Uint8Array): string {
  const pkcs8 = wrapPrivateKey(privateKey);
  const key = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const sig = nodeSign(null, Buffer.from(message), key);
  return Buffer.from(sig).toString("hex");
}

describe("QuorumRegistry", () => {
  afterEach(() => {
    _resetSignersForTest();
  });

  describe("governance stage detection", () => {
    it("starts at Stage0SingleKey (no signers)", () => {
      expect(getGovernanceStage()).toBe(GovernanceStage.Stage0SingleKey);
    });

    it("enters Stage0Insufficient with 1 signer", () => {
      registerSigner({
        label: "TSC-Member-Alice",
        publicKeyHex: "a".repeat(64),
        provisionedAt: new Date().toISOString(),
      });
      expect(getGovernanceStage()).toBe(GovernanceStage.Stage0Insufficient);
    });

    it("enters Stage1Multisig with 2+ signers", () => {
      registerSigner({
        label: "TSC-Member-Alice",
        publicKeyHex: "a".repeat(64),
        provisionedAt: new Date().toISOString(),
      });
      registerSigner({
        label: "TSC-Member-Bob",
        publicKeyHex: "b".repeat(64),
        provisionedAt: new Date().toISOString(),
      });
      expect(getGovernanceStage()).toBe(GovernanceStage.Stage1Multisig);
    });

    it("quorum config returns null at Stage0SingleKey", () => {
      expect(getQuorumConfig()).toBeNull();
    });

    it("quorum config is 2-of-2 at minimum Stage 1", () => {
      registerSigner({
        label: "TSC-Member-Alice",
        publicKeyHex: "a".repeat(64),
        provisionedAt: new Date().toISOString(),
      });
      registerSigner({
        label: "TSC-Member-Bob",
        publicKeyHex: "b".repeat(64),
        provisionedAt: new Date().toISOString(),
      });
      const config = getQuorumConfig();
      expect(config).not.toBeNull();
      expect(config!.required).toBe(2);
      expect(config!.total).toBe(2);
    });
  });

  describe("aggregated signature verification", () => {
    let aliceKeys: { privateKey: Uint8Array; publicKey: Uint8Array };
    let bobKeys: { privateKey: Uint8Array; publicKey: Uint8Array };
    let alicePubHex: string;
    let bobPubHex: string;
    const registryVersion = "GB-1.0";

    beforeAll(() => {
      aliceKeys = generateKeyPair();
      bobKeys = generateKeyPair();
      alicePubHex = Buffer.from(aliceKeys.publicKey).toString("hex");
      bobPubHex = Buffer.from(bobKeys.publicKey).toString("hex");
    });

    it("rejects if stage is Stage0Insufficient", async () => {
      registerSigner({
        label: "TSC-Member-Alice",
        publicKeyHex: alicePubHex,
        provisionedAt: new Date().toISOString(),
      });

      const payloadBytes = new Uint8Array(Buffer.from(registryVersion));
      const aliceSig = signWithKey(payloadBytes, aliceKeys.privateKey);

      const agg: AggregatedSignature = {
        registryVersion,
        aggregatedAt: new Date().toISOString(),
        signatures: {
          [alicePubHex]: {
            sigHex: aliceSig,
            signedAt: new Date().toISOString(),
            signerLabel: "TSC-Member-Alice",
          },
        },
      };

      await expect(verifyAggregatedSignature(agg)).rejects.toThrow(
        "Stage0Insufficient",
      );
    });

    it("quorum passes with 2-of-2 valid signatures", async () => {
      registerSigner({
        label: "TSC-Member-Alice",
        publicKeyHex: alicePubHex,
        provisionedAt: new Date().toISOString(),
      });
      registerSigner({
        label: "TSC-Member-Bob",
        publicKeyHex: bobPubHex,
        provisionedAt: new Date().toISOString(),
      });

      const payloadBytes = new Uint8Array(Buffer.from(registryVersion));
      const aliceSig = signWithKey(payloadBytes, aliceKeys.privateKey);
      const bobSig = signWithKey(payloadBytes, bobKeys.privateKey);

      const agg: AggregatedSignature = {
        registryVersion,
        aggregatedAt: new Date().toISOString(),
        signatures: {
          [alicePubHex]: {
            sigHex: aliceSig,
            signedAt: new Date().toISOString(),
            signerLabel: "TSC-Member-Alice",
          },
          [bobPubHex]: {
            sigHex: bobSig,
            signedAt: new Date().toISOString(),
            signerLabel: "TSC-Member-Bob",
          },
        },
      };

      const result = await verifyAggregatedSignature(agg);
      expect(result.valid).toBe(true);
      expect(result.quorumMet).toBe(true);
      expect(result.signersUsed).toBe(2);
      expect(result.unknownSigners).toHaveLength(0);
    });

    it("duplicate signature from same signer counted once", async () => {
      registerSigner({
        label: "TSC-Member-Alice",
        publicKeyHex: alicePubHex,
        provisionedAt: new Date().toISOString(),
      });

      // Add a second signer to enter Stage1Multisig
      const charlieKeys = generateKeyPair();
      const charliePubHex = Buffer.from(charlieKeys.publicKey).toString("hex");
      registerSigner({
        label: "TSC-Member-Charlie",
        publicKeyHex: charliePubHex,
        provisionedAt: new Date().toISOString(),
      });

      const payloadBytes = new Uint8Array(Buffer.from(registryVersion));
      const aliceSig = signWithKey(payloadBytes, aliceKeys.privateKey);
      const charlieSig = signWithKey(payloadBytes, charlieKeys.privateKey);

      const agg: AggregatedSignature = {
        registryVersion,
        aggregatedAt: new Date().toISOString(),
        signatures: {
          [alicePubHex]: {
            sigHex: aliceSig,
            signedAt: new Date().toISOString(),
            signerLabel: "TSC-Member-Alice",
          },
          [alicePubHex + "-dup"]: {
            sigHex: aliceSig,
            signedAt: new Date().toISOString(),
            signerLabel: "TSC-Member-Alice",
          },
          [charliePubHex]: {
            sigHex: charlieSig,
            signedAt: new Date().toISOString(),
            signerLabel: "TSC-Member-Charlie",
          },
        },
      };

      const result = await verifyAggregatedSignature(agg);
      expect(result.valid).toBe(true);
      expect(result.quorumMet).toBe(true);
      expect(result.signersUsed).toBe(2);
    });
  });
});
