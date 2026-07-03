import { describe, it, expect } from "@jest/globals";
import {
  canonicalize,
  signRegistry,
  verifyRegistry,
  generateKeyPair,
  RegistryError,
  RegistryErrorKind,
  type ObligationRegistry,
  type Obligation,
} from "../../lib/governance/signed-registry";

function sampleRegistry(): ObligationRegistry {
  const obligations: Record<string, Obligation> = {
    "OB-000001": {
      id: "OB-000001",
      name: "Right to Independent Verification",
      normative: "MUST",
      description: "test",
      currentArticle: "IV.2",
      historicalArticles: ["IV.2"],
      introduced: "Charter v7.0",
      amended: [],
      capability: "CAP-VERIFICATION",
      policy: "POL-RIGHTS-001",
    },
  };
  return { obligations, baselineVersion: "GB-1.0" };
}

describe("ObligationRegistry", () => {
  describe("canonicalize", () => {
    it("produces deterministic output", () => {
      const a = canonicalize(sampleRegistry());
      const b = canonicalize(sampleRegistry());
      expect(a).toEqual(b);
    });

    it("is order-independent (keys are sorted)", () => {
      const r1 = sampleRegistry();

      // Create a version with reversed insertion order
      const obligations2: Record<string, Obligation> = {};
      const keys = Object.keys(r1.obligations).reverse();
      for (const k of keys) {
        obligations2[k] = { ...r1.obligations[k] };
      }
      const r2: ObligationRegistry = {
        baselineVersion: r1.baselineVersion,
        obligations: obligations2,
      };

      expect(canonicalize(r2)).toEqual(canonicalize(r1));
    });
  });

  describe("sign and verify", () => {
    let keyPair: { privateKey: Uint8Array; publicKey: Uint8Array };

    beforeEach(() => {
      keyPair = generateKeyPair();
    });

    it("valid signature verifies", async () => {
      const reg = sampleRegistry();
      const signed = await signRegistry(reg, keyPair.privateKey);
      await expect(
        verifyRegistry(signed, keyPair.publicKey),
      ).resolves.toBeUndefined();
    });

    it("tampered payload fails hash check", async () => {
      const reg = sampleRegistry();
      const signed = await signRegistry(reg, keyPair.privateKey);
      signed.canonicalPayload.push(0xff); // tamper after signing

      await expect(verifyRegistry(signed, keyPair.publicKey)).rejects.toThrow(
        RegistryError,
      );
      await expect(verifyRegistry(signed, keyPair.publicKey)).rejects.toHaveProperty(
        "kind",
        RegistryErrorKind.HashMismatch,
      );
    });

    it("wrong signer key is rejected", async () => {
      const reg = sampleRegistry();
      const attackerPair = generateKeyPair();
      const signed = await signRegistry(reg, attackerPair.privateKey);

      // Verifier trusts the original keyPair, not attackerPair
      // Even though the signature is internally valid, it must be rejected
      await expect(
        verifyRegistry(signed, keyPair.publicKey),
      ).rejects.toThrow(RegistryError);
      await expect(
        verifyRegistry(signed, keyPair.publicKey),
      ).rejects.toHaveProperty("kind", RegistryErrorKind.UnknownSigner);
    });
  });

  describe("generateKeyPair", () => {
    it("produces 32-byte keys", () => {
      const kp = generateKeyPair();
      expect(kp.privateKey).toHaveLength(32);
      expect(kp.publicKey).toHaveLength(32);
    });

    it("produces different keys each call", () => {
      const kp1 = generateKeyPair();
      const kp2 = generateKeyPair();
      expect(Buffer.from(kp1.privateKey).toString("hex")).not.toBe(
        Buffer.from(kp2.privateKey).toString("hex"),
      );
    });
  });
});
