// lindiwe.go — Lindiwe Governance Oracle + UbuntuGames Arena
//
// The "Ubuntu Consensus Engine" that transforms ProofBridge from a
// single-player verifier into a multi-player truth network.
//
// Responsibilities:
//   1. Gossip Listener — subscribes to IPFS PubSub channels for new
//      proof announcements from the Ubuntu Pool consortium.
//   2. Cosign Verification — validates each attestation against the
//      trusted keyring using Sigstore/Cosign.
//   3. RatifyProof — when threshold trust is reached, marks a theorem
//      as "Canonical" and triggers CRAFT vector ingestion.
//   4. UbuntuGames Arena — manages bounty lifecycle, reputation escrow,
//      Purgatory timer, Red/Blue team resolution, and PubSub events
//      on the "arena-events" channel.
//   5. Nightly Vector Sync — pulls ratified global vectors from the
//      Pool and merges them into the local Milvus index.
//
// Architecture:
//   IPFS PubSub → ListenForTruth → ValidateSignature → RatifyProof
//                                                      ↓
//                                            TriggerCRAFTIngestion
//                                                      ↓
//                                            nightly_vector_sync.py
//
//   Arena Tick (10s) → Check Purgatory expiry → Canonize / Award Rep
//   Arena Claim       → Lock stake → Start 24h timer → PubSub event
//   Arena Breach      → Validate via referee.lean → Slash / Award
//
// Build:
//   go build -o lindiwe lindiwe.go arena.go
//
// Run:
//   go run lindiwe.go arena.go   (or the compiled binary)

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"
)

// ── Trust Configuration ──────────────────────────────────────────────────────

// CONSENSUS_THRESHOLD is the minimum trust weight required before a proof is
// ratified as "Canonical."  Each trusted key contributes its reputation weight.
const CONSENSUS_THRESHOLD = 100

// IPFS_API is the URL of the local IPFS node's API endpoint.
var IPFS_API = getEnv("IPFS_API", "http://ubuntu-pool:5001/api/v0")

// IPFS_TOPIC is the global PubSub channel for proof announcements.
const IPFS_TOPIC = "proofbridge-global-consensus"

// Arena tick interval (seconds)
const ARENA_TICK_INTERVAL = 10

// TrustedKeys lists the public keys of the consortium members.
// In production, these are mounted from /keys/public/ as read-only files.
var TrustedKeys = []struct {
	Label    string
	KeyPath  string
	RepScore int // reputation weight for consensus calculation
}{
	{Label: "math_dept_mit",        KeyPath: "/keys/public/math_dept_mit.pub",        RepScore: 60},
	{Label: "lean_foundation",      KeyPath: "/keys/public/lean_foundation.pub",      RepScore: 50},
	{Label: "proofbridge_auditor",  KeyPath: "/keys/public/proofbridge_auditor.pub",  RepScore: 40},
	{Label: "oxford_verified",     KeyPath: "/keys/public/oxford_verified.pub",      RepScore: 40},
	{Label: "ubuntu_pool_genesis", KeyPath: "/keys/public/ubuntu_pool_genesis.pub",  RepScore: 30},
}

// ── Arena Engine (UbuntuGames) ───────────────────────────────────────────────

// arenaEngine is the global UbuntuGames state machine managing bounty lifecycles,
// reputation scores, and Purgatory timers.
var arenaEngine = NewArenaEngine(getEnv("IPFS_API", "http://ubuntu-pool:5001/api/v0"))

// ── Data Structures ──────────────────────────────────────────────────────────

// Attestation represents a signed proof artifact anchored to IPFS.
type Attestation struct {
	ProofCID  string `json:"proof_cid"`
	SigCID    string `json:"sig_cid"`
	ProofHash string `json:"proof_hash"`
	SigHash   string `json:"sig_hash"`
	Timestamp string `json:"timestamp"`
	File      string `json:"file"`
	Algorithm string `json:"algorithm"`
}

// ConsensusRecord tracks the accumulated trust for a given proof CID.
type ConsensusRecord struct {
	ProofCID      string
	TotalWeight   int
	Signatories   []string
	Ratified      bool
	FirstSeen     time.Time
}

// ConsensusLedger is the in-memory state of all known proofs and their
// accumulated trust scores.  In production, this would be backed by
// a persistent store (BadgerDB / etcd).
var ConsensusLedger = make(map[string]*ConsensusRecord)

// ── Helpers ──────────────────────────────────────────────────────────────────

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

// ── Phase 1: Gossip Listener ─────────────────────────────────────────────────

// ListenForTruth subscribes to the IPFS PubSub channel and processes
// incoming proof announcements.  This is the "Ear" of the Ubuntu Pool.
//
// In production this would use the IPFS PubSub API.  For environments
// where the IPFS client library is not available, we simulate polling
// via the IPFS API's PubSub endpoint.
func ListenForTruth(topic string) {
	log.Printf("[Lindiwe] 📡  Listening on PubSub channel: %s", topic)
	log.Printf("[Lindiwe]     IPFS API: %s", IPFS_API)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// Poll IPFS for new messages on the consensus topic.
		// The actual subscription mechanism varies; here we simulate
		// by checking a known IPFS MFS path for new entries.
		cmd := exec.Command("curl", "-s",
			fmt.Sprintf("%s/pubsub/sub?arg=%s", IPFS_API, topic))
		output, err := cmd.CombinedOutput()
		if err != nil {
			log.Printf("[Lindiwe] [pubsub poll error] %v", err)
			continue
		}

		if len(output) < 10 {
			continue // no new messages
		}

		log.Printf("[Lindiwe] 📨  New PubSub message received (%d bytes)", len(output))

		// Parse the message as an attestation CID
		var msg struct {
			Data string `json:"data"`
			From string `json:"from"`
		}
		if err := json.Unmarshal(output, &msg); err != nil {
			log.Printf("[Lindiwe] [parse error] %v", err)
			continue
		}

		// Light validation: does the CID look valid?
		if len(msg.Data) < 10 {
			log.Printf("[Lindiwe] ⚠  Skipping short/nil CID: %q", msg.Data)
			continue
		}

		log.Printf("[Lindiwe] 🔍  Evaluating attestation: CID=%s from=%s", msg.Data, msg.From)
		go handleAttestation(msg.Data)
	}
}

// ── Phase 2: Attestation Handler ─────────────────────────────────────────────

// handleAttestation fetches the attestation JSON from IPFS, downloads the
// proof and signature blobs, and validates them against the trusted keyring.
func handleAttestation(attestationCID string) {
	log.Printf("[Lindiwe]   Fetching attestation: %s", attestationCID)

	// 1. Download attestation JSON from IPFS
	cmd := exec.Command("curl", "-s",
		fmt.Sprintf("%s/cat?arg=%s", IPFS_API, attestationCID))
	output, err := cmd.Output()
	if err != nil {
		log.Printf("[Lindiwe]   ⚠  Failed to fetch attestation: %v", err)
		return
	}

	var att Attestation
	if err := json.Unmarshal(output, &att); err != nil {
		log.Printf("[Lindiwe]   ⚠  Failed to parse attestation JSON: %v", err)
		return
	}

	log.Printf("[Lindiwe]   Attestation: proof=%s signature=%s file=%s",
		att.ProofCID, att.SigCID, att.File)

	// 2. Verify against trusted keyring
	verified := false
	verifiedBy := ""

	for _, key := range TrustedKeys {
		if validateSignature(att, key.KeyPath) {
			verified = true
			verifiedBy = key.Label
			accumulateTrust(att.ProofCID, key.Label, key.RepScore)
			log.Printf("[Lindiwe]   ✅  Valid signature from: %s (weight +%d)",
				key.Label, key.RepScore)
			break
		}
	}

	if !verified {
		log.Printf("[Lindiwe]   ⚠  No trusted signature found for %s", att.ProofCID)
		return
	}

	log.Printf("[Lindiwe]   ✅  Attestation validated by: %s", verifiedBy)

	// 3. Check if consensus threshold is met
	record, exists := ConsensusLedger[att.ProofCID]
	if exists && record.TotalWeight >= CONSENSUS_THRESHOLD && !record.Ratified {
		ratifyProof(att.ProofCID)
	}
}

// ── Signature Validation ─────────────────────────────────────────────────────

// validateSignature downloads the signature blob from IPFS and the proof
// hash, then calls Cosign to verify the signature against the given public key.
func validateSignature(att Attestation, pubKeyPath string) bool {
	// Download the signature blob from IPFS
	sigCmd := exec.Command("curl", "-s",
		fmt.Sprintf("%s/cat?arg=%s", IPFS_API, att.SigCID))
	sigOutput, err := sigCmd.Output()
	if err != nil || len(sigOutput) < 10 {
		return false
	}

	// Write signature to temp file
	sigFile := fmt.Sprintf("/tmp/%s.sig", att.ProofCID)
	if err := os.WriteFile(sigFile, sigOutput, 0600); err != nil {
		log.Printf("[Lindiwe]   [sig write error] %v", err)
		return false
	}
	defer os.Remove(sigFile)

	// Run Cosign verify-blob
	// cosign verify-blob --key <pubkey> --signature <sigfile> <hash>
	cmd := exec.Command("cosign", "verify-blob",
		"--key", pubKeyPath,
		"--signature", sigFile,
		att.ProofHash,
	)

	if err := cmd.Run(); err != nil {
		return false
	}
	return true
}

// ── Trust Accumulation ──────────────────────────────────────────────────────

// accumulateTrust updates the consensus ledger with a new signature.
func accumulateTrust(proofCID string, signatory string, weight int) {
	record, exists := ConsensusLedger[proofCID]
	if !exists {
		record = &ConsensusRecord{
			ProofCID:    proofCID,
			FirstSeen:   time.Now(),
			Signatories: []string{},
		}
		ConsensusLedger[proofCID] = record
	}

	// Avoid double-counting the same signatory
	for _, s := range record.Signatories {
		if s == signatory {
			log.Printf("[Lindiwe]   [duplicate] %s already signed %s", signatory, proofCID)
			return
		}
	}

	record.Signatories = append(record.Signatories, signatory)
	record.TotalWeight += weight

	log.Printf("[Lindiwe]   📊  Trust: %s = %d/%d (signatories: %v)",
		proofCID, record.TotalWeight, CONSENSUS_THRESHOLD, record.Signatories)
}

// ── Phase 3: RatifyProof ─────────────────────────────────────────────────────

// ratifyProof marks a proof as Canonical and triggers CRAFT ingestion.
func ratifyProof(proofCID string) {
	record := ConsensusLedger[proofCID]
	record.Ratified = true

	log.Printf("[Lindiwe] ═══════════════════════════════════════════")
	log.Printf("[Lindiwe]  🏛  PROOF RATIFIED AS CANONICAL")
	log.Printf("[Lindiwe]  CID: %s", proofCID)
	log.Printf("[Lindiwe]  Trust: %d/%d", record.TotalWeight, CONSENSUS_THRESHOLD)
	log.Printf("[Lindiwe]  Signatories: %v", record.Signatories)
	log.Printf("[Lindiwe]  Time to consensus: %s", time.Since(record.FirstSeen).Round(time.Second))
	log.Printf("[Lindiwe] ═══════════════════════════════════════════")

	// Trigger CRAFT ingestion so the local Milvus learns from this proof
	TriggerCRAFTIngestion(proofCID)

	// Pin the proof on the local IPFS node for persistence
	pinCmd := exec.Command("curl", "-s", "-X", "POST",
		fmt.Sprintf("%s/pin/add?arg=%s", IPFS_API, proofCID))
	if out, err := pinCmd.CombinedOutput(); err != nil {
		log.Printf("[Lindiwe]   ⚠  Pin failed: %s", string(out))
	} else {
		log.Printf("[Lindiwe]   📌  Proof pinned to local IPFS node")
	}
}

// TriggerCRAFTIngestion calls the CRAFT nightly-vector-sync worker to
// embed the ratified proof and upsert it into the local Milvus index.
func TriggerCRAFTIngestion(proofCID string) {
	log.Printf("[Lindiwe]   🔄  Triggering CRAFT vector ingestion for %s", proofCID)

	// The Python worker mounts /craft from ../scripts/craft
	cmd := exec.Command("python3", "/craft/nightly-vector-sync.py",
		"--cid", proofCID,
		"--ipfs-api", IPFS_API,
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("[Lindiwe]   ⚠  CRAFT ingestion failed: %v", err)
		log.Printf("[Lindiwe]      Output: %s", string(output))
		return
	}

	log.Printf("[Lindiwe]   ✅  CRAFT ingestion complete")
	log.Printf("[Lindiwe]      %s", string(output))
}

// ── Phase 4: Nightly Vector Sync ─────────────────────────────────────────────

// NightlyVectorSync pulls the latest ratified global vector index from the
// Ubuntu Pool and merges it into the local Milvus collection.
func NightlyVectorSync() {
	log.Printf("[Lindiwe] 🌙  Nightly vector sync initiated...")

	// The global index is published to IPFS as "latest-vector-index.bin"
	// by the consortium's leader node(s).
	indexCID := "latest-vector-index.bin"

	cmd := exec.Command("python3", "/craft/nightly-vector-sync.py",
		"--global-index", indexCID,
		"--ipfs-api", IPFS_API,
		"--milvus-host", "craft-milvus",
		"--milvus-port", "19530",
		"--collection", "craft_theorems",
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("[Lindiwe]   ⚠  Nightly sync failed: %v", err)
		log.Printf("[Lindiwe]      Output: %s", string(output))
		return
	}

	log.Printf("[Lindiwe]   ✅  Nightly vector sync complete")
	log.Printf("[Lindiwe]      %s", string(output))

	// Schedule next sync in 24 hours
	time.AfterFunc(24*time.Hour, func() {
		log.Printf("[Lindiwe] 🌙  Scheduling next nightly sync...")
		NightlyVectorSync()
	})
}

// ── UbuntuGames Arena Ticker ──────────────────────────────────────────────────

// startArenaTicker runs the ArenaEngine Tick() on a fixed interval and
// emits state snapshots to the "arena-events" PubSub channel.
func startArenaTicker() {
	log.Printf("[Arena] 🎲  Ticker started (interval: %ds)", ARENA_TICK_INTERVAL)
	ticker := time.NewTicker(time.Duration(ARENA_TICK_INTERVAL) * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		arenaEngine.Tick()

		// Publish arena state snapshot to IPFS PubSub for dashboard
		stateDump := arenaEngine.DumpState()
		if len(stateDump) > 50 {
			cmd := exec.Command("curl", "-s", "-X", "POST",
				fmt.Sprintf("%s/pubsub/pub?arg=%s", IPFS_API, "arena-events"),
				"--data-binary", stateDump,
			)
			if out, err := cmd.CombinedOutput(); err != nil {
				log.Printf("[Arena] [pubsub publish error] %s", string(out))
			}
		}

		// Log active Purgatory count for observability
		purgatoryCount := 0
		arenaEngine.mu.RLock()
		for _, b := range arenaEngine.Bounties {
			if b.Status == StatusPurgatory {
				purgatoryCount++
			}
		}
		arenaEngine.mu.RUnlock()
		if purgatoryCount > 0 {
			log.Printf("[Arena] ⏳  %d bounties in Purgatory", purgatoryCount)
		}
	}
}

// ── Main ─────────────────────────────────────────────────────────────────────

func main() {
	log.SetFlags(0)
	log.SetOutput(os.Stderr)

	log.Println("[Lindiwe] ═══════════════════════════════════════════")
	log.Println("[Lindiwe]  Ubuntu Governance Oracle v1.0")
	log.Println("[Lindiwe]  \"I am because we are.\"")
	log.Println("[Lindiwe] ═══════════════════════════════════════════")
	log.Printf("[Lindiwe]  IPFS API:    %s", IPFS_API)
	log.Printf("[Lindiwe]  Topic:       %s", IPFS_TOPIC)
	log.Printf("[Lindiwe]  Threshold:   %d", CONSENSUS_THRESHOLD)
	log.Printf("[Lindiwe]  Trusted Keys: %d", len(TrustedKeys))
	log.Println("")

	// Start the gossip listener in a goroutine
	go ListenForTruth(IPFS_TOPIC)

	// Schedule the first nightly sync after a 60-second startup delay
	log.Println("[Lindiwe] ⏰  First nightly sync scheduled in 60s...")
	time.AfterFunc(60*time.Second, func() {
		log.Println("[Lindiwe] 🌙  First nightly sync starting...")
		NightlyVectorSync()
	})

	// Start the UbuntuGames Arena ticker (every 10 seconds)
	go startArenaTicker()

	log.Printf("[Lindiwe] 🎮  UbuntuGames Arena active — %d bounties tracked", len(arenaEngine.Bounties))
	log.Printf("[Lindiwe] 🎮  Tick interval: %ds", ARENA_TICK_INTERVAL)

	// Block forever — the goroutines keep the node alive.
	select {}
}
