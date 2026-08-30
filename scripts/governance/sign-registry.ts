#!/usr/bin/env npx tsx
/**
 * sign-registry.ts — CI entrypoint for signing and verifying the Obligation Registry
 *
 * Usage:
 *   # Sign the registry and produce a signed artifact
 *   npx tsx scripts/governance/sign-registry.ts \
 *     --registry GOVERNANCE/OBLIGATION-REGISTRY.yaml \
 *     --key <hex-private-key> \
 *     --publish GOVERNANCE/signed/
 *
 *   # Verify a signed artifact
 *   npx tsx scripts/governance/sign-registry.ts \
 *     --verify GOVERNANCE/signed/obligation-registry.signed.json \
 *     --trusted-key GOVERNANCE/TRUSTED-SIGNER-GB-1.0.pem
 *
 *   # CI gate — verify then exit 0/1
 *   npx tsx scripts/governance/sign-registry.ts \
 *     --gate \
 *     --registry-path GOVERNANCE/OBLIGATION-REGISTRY.yaml \
 *     --trusted-key-path GOVERNANCE/TRUSTED-SIGNER-GB-1.0.pem
 *
 * Environment variables:
 *   SAFEKRIPTE_ROOT_KEY — hex-encoded Ed25519 private key (for signing)
 *   SKIP_SIGNATURE_CHECK — set to "1" to bypass verification (dev only)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  canonicalize,
  signRegistry,
  verifyRegistry,
  ciVerifyRegistry,
  derivePublicKey,
  type ObligationRegistry,
  type Obligation,
  type SignedRegistry,
  RegistryError,
} from "../../lib/governance";

// ── CLI argument parsing ───────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = process.argv[i + 1];
      if (val && !val.startsWith("--")) {
        args[key] = val;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

// ── Registry loader ────────────────────────────────────────────────────────

function loadRegistry(yamlPath: string): ObligationRegistry {
  const yaml = fs.readFileSync(yamlPath, "utf8");
  const lines = yaml.split("\n");
  let baselineVersion = "unknown";
  const obligations: Record<string, Obligation> = {};

  let currentObligation: Partial<Obligation> | null = null;
  let currentId: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    const bvMatch = line.match(/^baseline_version:\s*"([^"]+)"/);
    if (bvMatch) {
      baselineVersion = bvMatch[1];
      continue;
    }

    const idMatch = line.match(/^\s{2}(\S+):$/);
    if (idMatch && currentObligation === null) {
      currentId = idMatch[1];
      currentObligation = { id: currentId };
      continue;
    }

    if (currentObligation !== null) {
      const fieldMatch = line.match(/^\s{4}(\w+):\s*(.*)/);
      if (fieldMatch) {
        const [, key, rawVal] = fieldMatch;
        const val = rawVal.trim().replace(/^"|"$/g, "");

        switch (key) {
          case "id":
            currentObligation.id = val;
            currentId = val;
            break;
          case "name":
            currentObligation.name = val;
            break;
          case "normative":
            currentObligation.normative = val;
            break;
          case "description":
            currentObligation.description = val;
            break;
          case "current_article":
            currentObligation.currentArticle = val;
            break;
          case "introduced":
            currentObligation.introduced = val;
            break;
          case "capability":
            currentObligation.capability = val;
            break;
          case "policy":
            currentObligation.policy = val;
            break;
        }
      }

      if (rawLine.trim() === "" || (line.match(/^\S/) && currentId && currentObligation.id)) {
        if (currentId && currentObligation.id && currentObligation.normative) {
          obligations[currentId] = currentObligation as Obligation;
        }
        currentObligation = null;
        currentId = null;
      }
    }
  }

  if (currentId && currentObligation && currentObligation.normative) {
    obligations[currentId] = currentObligation as Obligation;
  }

  return { baselineVersion, obligations };
}

// ── Key loader ─────────────────────────────────────────────────────────────

function loadPrivateKey(): Uint8Array {
  const fromEnv = process.env.SAFEKRIPTE_ROOT_KEY;
  if (fromEnv) {
    const hex = fromEnv.trim();
    if (!/^[0-9a-f]{64}$/i.test(hex)) {
      console.error("SAFEKRIPTE_ROOT_KEY: expected 64 hex chars (32 bytes)");
      process.exit(1);
    }
    return Buffer.from(hex, "hex");
  }

  // Fallback: generate a test key (dev only — real signing uses SafeKrypte)
  console.warn("WARNING: SAFEKRIPTE_ROOT_KEY not set. Generating ephemeral key (dev only).");
  const { generateKeyPair } = require("../../lib/governance");
  return generateKeyPair().privateKey;
}

// ── Commands ───────────────────────────────────────────────────────────────

async function cmdSign(registryPath: string, publishDir: string): Promise<void> {
  const registry = loadRegistry(registryPath);
  const privateKey = loadPrivateKey();
  const signed = await signRegistry(registry, privateKey);

  const signedJson = JSON.stringify(signed, null, 2);
  const basename = path.basename(registryPath, path.extname(registryPath));
  const outputPath = path.join(publishDir, `${basename}.signed.json`);

  fs.mkdirSync(publishDir, { recursive: true });
  fs.writeFileSync(outputPath, signedJson, "utf8");

  console.log(`Signed registry written to: ${outputPath}`);
  console.log(`Payload hash: ${signed.payloadHash}`);
  console.log(`Signer key:   ${Buffer.from(signed.signerPublicKey).toString("hex")}`);

  // Also publish the public key if it doesn't exist yet
  const pubKeyPath = path.join(publishDir, "signer.pub.pem");
  if (!fs.existsSync(pubKeyPath)) {
    const pubKey = derivePublicKey(privateKey);
    const pem = [
      "-----BEGIN PUBLIC KEY-----",
      Buffer.from(pubKey).toString("base64"),
      "-----END PUBLIC KEY-----",
    ].join("\n");
    fs.writeFileSync(pubKeyPath, pem, "utf8");
    console.log(`Public key published to: ${pubKeyPath}`);
  }
}

async function cmdVerify(signedPath: string, trustedKeyPath: string): Promise<void> {
  const result = await ciVerifyRegistry({
    registryPath: signedPath,
    trustedKeyPath: trustedKeyPath,
  });
  if (result) {
    console.log("✓ Signature verification: PASSED");
  }
}

async function cmdGate(registryPath: string, trustedKeyPath: string): Promise<void> {
  const signedJson = fs.readFileSync(registryPath, "utf8");
  const signed: SignedRegistry = JSON.parse(signedJson);

  const trustedPem = fs.readFileSync(trustedKeyPath, "utf8");
  const derBase64 = trustedPem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const der = Buffer.from(derBase64, "base64");
  const trustedKey = der.length === 44 ? new Uint8Array(der.subarray(12)) : new Uint8Array(der);

  await verifyRegistry(signed, trustedKey);
  console.log("✓ CI gate: Registry signature is valid");
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.verify) {
    await cmdVerify(
      args.verify,
      args["trusted-key"] || "GOVERNANCE/TRUSTED-SIGNER-GB-1.0.pem",
    );
  } else if (args.gate) {
    const registryPath =
      args["registry-path"] || "GOVERNANCE/signed/obligation-registry.signed.json";
    const trustedKeyPath =
      args["trusted-key-path"] || "GOVERNANCE/TRUSTED-SIGNER-GB-1.0.pem";
    await cmdGate(registryPath, trustedKeyPath);
  } else if (args.registry) {
    await cmdSign(args.registry, args.publish || "GOVERNANCE/signed");
  } else {
    console.log(`
Usage:
  npx tsx scripts/governance/sign-registry.ts \\
    --registry GOVERNANCE/OBLIGATION-REGISTRY.yaml \\
    [--publish GOVERNANCE/signed/]

  npx tsx scripts/governance/sign-registry.ts \\
    --verify GOVERNANCE/signed/obligation-registry.signed.json \\
    [--trusted-key GOVERNANCE/TRUSTED-SIGNER-GB-1.0.pem]

  npx tsx scripts/governance/sign-registry.ts \\
    --gate \\
    [--registry-path GOVERNANCE/signed/obligation-registry.signed.json] \\
    [--trusted-key-path GOVERNANCE/TRUSTED-SIGNER-GB-1.0.pem]
`);
  }
}

main().catch((err) => {
  if (err instanceof RegistryError) {
    console.error(`✗ ${err.kind}: ${err.message}`);
    if (err.detail) console.error("  Details:", err.detail);
  } else {
    console.error("✗ Error:", err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
});
