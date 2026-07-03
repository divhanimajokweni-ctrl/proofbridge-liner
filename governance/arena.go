// arena.go — UbuntuGames Arena Engine
//
// The adversarial-collaboration state machine that transforms the Ubuntu Pool
// from a passive library into a competitive Arena of Truth.
//
// Bounty Lifecycle:
//   OPEN ──(Blue claims)──► PURGATORY ──(24h expires)──► CANONICAL
//                              │
//                              └──(Red breaches)──► BREACHED
//
// Three Game Modes:
//   SIEGE    — Red vs Blue: attack theorem specifications
//   GOLF     — Speedrun: optimise proof size / compile time
//   CRUSADE  — MMO co-op: break huge theorems into dependency trees
//
// Integration:
//   - Called by lindiwe.go Tick() every 10s
//   - Emits IPFS PubSub events on state transitions
//   - State is persisted in-memory (backed by etcd in production)

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"
)

// ── Domain Types ─────────────────────────────────────────────────────────────

type BountyStatus string

const (
	StatusOpen      BountyStatus = "OPEN"
	StatusPurgatory BountyStatus = "PURGATORY"
	StatusCanonical BountyStatus = "CANONICAL"
	StatusBreached  BountyStatus = "BREACHED"
)

type GameMode string

const (
	ModeSiege   GameMode = "SIEGE"
	ModeGolf    GameMode = "GOLF"
	ModeCrusade GameMode = "CRUSADE"
)

type Difficulty string

const (
	DiffGodTier  Difficulty = "God-Tier"
	DiffHard     Difficulty = "Hard"
	DiffMedium   Difficulty = "Medium"
	DiffEasy     Difficulty = "Easy"
)

// Bounty represents a single theorem contest in the Arena.
type Bounty struct {
	ID            string       `json:"id"`
	TheoremName   string       `json:"theorem_name"`
	Complexity    Difficulty   `json:"complexity"`
	Mode          GameMode     `json:"mode"`
	RepReward     int          `json:"rep_reward"`
	BlueClaimant  string       `json:"blue_claimant,omitempty"`
	RedBreacher   string       `json:"red_breacher,omitempty"`
	PurgatoryEnd  time.Time    `json:"purgatory_end,omitempty"`
	Status        BountyStatus `json:"status"`
	ProofCID      string       `json:"proof_cid,omitempty"`
	BreachCID     string       `json:"breach_cid,omitempty"`
	LinesOriginal int          `json:"lines_original,omitempty"` // For Golf mode
	LinesNew      int          `json:"lines_new,omitempty"`
	SubBounties   []string     `json:"sub_bounties,omitempty"` // For Crusade mode
	CreatedAt     time.Time    `json:"created_at"`
}

// ArenaEvent is emitted to IPFS PubSub on state transitions.
type ArenaEvent struct {
	Type      string       `json:"type"` // CLAIMED | BREACHED | CANONIZED | STAKED
	BountyID  string       `json:"bounty_id"`
	Theorem   string       `json:"theorem"`
	Status    BountyStatus `json:"status"`
	User      string       `json:"user,omitempty"`
	Timestamp string       `json:"timestamp"`
}

// ── Arena Engine ─────────────────────────────────────────────────────────────

type ArenaEngine struct {
	mu       sync.RWMutex
	Bounties map[string]*Bounty
	RepScores map[string]int // user -> Lindiwe Reputation score
	IPFSAPI   string
}

func NewArenaEngine(ipfsAPI string) *ArenaEngine {
	engine := &ArenaEngine{
		Bounties:  make(map[string]*Bounty),
		RepScores: make(map[string]int),
		IPFSAPI:   ipfsAPI,
	}

	// Seed with grand-challenge bounties
	engine.seedGrandChallenges()
	// Seed initial reputation for known nodes
	engine.seedReputation()

	return engine
}

func (a *ArenaEngine) seedGrandChallenges() {
	grands := []Bounty{
		{
			ID: "b1", TheoremName: "Riemann_Zeta_Zeros",
			Complexity: DiffGodTier, Mode: ModeCrusade,
			RepReward: 100000, Status: StatusOpen,
			CreatedAt: time.Now(),
		},
		{
			ID: "b2", TheoremName: "Navier_Stokes_Smoothness",
			Complexity: DiffHard, Mode: ModeCrusade,
			RepReward: 50000, Status: StatusOpen,
			CreatedAt: time.Now(),
		},
		{
			ID: "b3", TheoremName: "P_vs_NP",
			Complexity: DiffGodTier, Mode: ModeSiege,
			RepReward: 100000, Status: StatusOpen,
			CreatedAt: time.Now(),
		},
		{
			ID: "b4", TheoremName: "Yang_Mills_Existence",
			Complexity: DiffGodTier, Mode: ModeCrusade,
			RepReward: 100000, Status: StatusOpen,
			CreatedAt: time.Now(),
		},
		{
			ID: "b5", TheoremName: "Lemma_Topology_4.2",
			Complexity: DiffMedium, Mode: ModeSiege,
			RepReward: 500, Status: StatusPurgatory,
			BlueClaimant: "@Tokyo_Node",
			PurgatoryEnd: time.Now().Add(14 * time.Hour),
			CreatedAt:    time.Now().Add(-10 * time.Hour),
		},
		{
			ID: "b6", TheoremName: "QuickSort_Correctness",
			Complexity: DiffEasy, Mode: ModeGolf,
			RepReward: 200, Status: StatusOpen,
			LinesOriginal: 68,
			CreatedAt:     time.Now().Add(-2 * time.Hour),
		},
		{
			ID: "b7", TheoremName: "Banach_Tarski_Decomposition",
			Complexity: DiffHard, Mode: ModeSiege,
			RepReward: 1200, Status: StatusCanonical,
			BlueClaimant: "@Oxford_Lab",
			CreatedAt:    time.Now().Add(-48 * time.Hour),
		},
	}
	for i := range grands {
		a.Bounties[grands[i].ID] = &grands[i]
	}
	log.Printf("[Arena] Seeded %d grand-challenge bounties", len(grands))
}

func (a *ArenaEngine) seedReputation() {
	seeds := map[string]int{
		"@Tokyo_Node":    3400,
		"@Oxford_Lab":    7200,
		"@MIT_Node":      8900,
		"@Red_Team_Alpha": 2100,
		"@Lean_Fndtn":   15000,
	}
	for user, rep := range seeds {
		a.RepScores[user] = rep
	}
	log.Printf("[Arena] Seeded reputation for %d identities", len(seeds))
}

// ── Commands ─────────────────────────────────────────────────────────────────

// ClaimBounty — Blue Team submits a proof. OPEN → PURGATORY.
func (a *ArenaEngine) ClaimBounty(bountyID string, user string, proofCID string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	b, exists := a.Bounties[bountyID]
	if !exists {
		return fmt.Errorf("bounty %s not found", bountyID)
	}
	if b.Status != StatusOpen {
		return fmt.Errorf("bounty %s is not OPEN (status: %s)", bountyID, b.Status)
	}

	// Deduct stake (10% of reward)
	stake := b.RepReward / 10
	if a.RepScores[user] < stake {
		return fmt.Errorf("insufficient reputation: have %d, need %d", a.RepScores[user], stake)
	}
	a.RepScores[user] -= stake

	b.Status = StatusPurgatory
	b.BlueClaimant = user
	b.ProofCID = proofCID
	b.PurgatoryEnd = time.Now().Add(24 * time.Hour)

	log.Printf("[Arena] 🛡️  CLAIMED: %s by %s | stake=%d | purgatory until %s",
		b.TheoremName, user, stake, b.PurgatoryEnd.Format(time.RFC3339))

	a.emitEvent(ArenaEvent{
		Type: "CLAIMED", BountyID: bountyID, Theorem: b.TheoremName,
		Status: StatusPurgatory, User: user, Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
	return nil
}

// BreachBounty — Red Team breaks a Purgatory proof. PURGATORY → BREACHED.
func (a *ArenaEngine) BreachBounty(bountyID string, attacker string, breachCID string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	b, exists := a.Bounties[bountyID]
	if !exists {
		return fmt.Errorf("bounty %s not found", bountyID)
	}
	if b.Status != StatusPurgatory {
		return fmt.Errorf("bounty %s is not in PURGATORY (status: %s)", bountyID, b.Status)
	}

	// Award attacker the reward (stolen from Blue's potential earnings)
	reward := b.RepReward / 2
	a.RepScores[attacker] += reward

	b.Status = StatusBreached
	b.RedBreacher = attacker
	b.BreachCID = breachCID

	log.Printf("[Arena] ⚔️  BREACHED: %s by %s | reward=%d stolen from %s",
		b.TheoremName, attacker, reward, b.BlueClaimant)

	a.emitEvent(ArenaEvent{
		Type: "BREACHED", BountyID: bountyID, Theorem: b.TheoremName,
		Status: StatusBreached, User: attacker, Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
	return nil
}

// SubmitGolfScore — Blue Team submits an optimised proof in Golf mode.
func (a *ArenaEngine) SubmitGolfScore(bountyID string, user string, newLines int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	b, exists := a.Bounties[bountyID]
	if !exists {
		return fmt.Errorf("bounty %s not found", bountyID)
	}
	if b.Mode != ModeGolf {
		return fmt.Errorf("bounty %s is not in GOLF mode", bountyID)
	}

	if b.LinesOriginal == 0 {
		return fmt.Errorf("bounty %s has no original line count", bountyID)
	}

	improvement := b.LinesOriginal - newLines
	if improvement <= 0 {
		return fmt.Errorf("no improvement: original=%d new=%d", b.LinesOriginal, newLines)
	}

	score := improvement * 100
	a.RepScores[user] += score

	log.Printf("[Arena] 🏌️  GOLF SCORE: %s by %s | %d→%d lines | +%d REP",
		b.TheoremName, user, b.LinesOriginal, newLines, score)

	a.emitEvent(ArenaEvent{
		Type: "STAKED", BountyID: bountyID, Theorem: b.TheoremName,
		Status: b.Status, User: user, Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
	return nil
}

// ── Tick — Called every 10s from lindiwe.go ──────────────────────────────────

func (a *ArenaEngine) Tick() {
	a.mu.Lock()
	defer a.mu.Unlock()

	now := time.Now()
	for _, b := range a.Bounties {
		if b.Status == StatusPurgatory && now.After(b.PurgatoryEnd) {
			// PURGATORY → CANONICAL: survived the Red Team attack window
			b.Status = StatusCanonical

			// Award full reward to Blue
			a.RepScores[b.BlueClaimant] += b.RepReward

			log.Printf("[Arena] 🏆  CANONIZED: %s by %s | reward=%d",
				b.TheoremName, b.BlueClaimant, b.RepReward)

			a.emitEvent(ArenaEvent{
				Type: "CANONIZED", BountyID: b.ID, Theorem: b.TheoremName,
				Status: StatusCanonical, User: b.BlueClaimant,
				Timestamp: now.UTC().Format(time.RFC3339),
			})
		}
	}
}

// ── Queries ──────────────────────────────────────────────────────────────────

func (a *ArenaEngine) ListBounties() []*Bounty {
	a.mu.RLock()
	defer a.mu.RUnlock()

	result := make([]*Bounty, 0, len(a.Bounties))
	for _, b := range a.Bounties {
		result = append(result, b)
	}
	return result
}

func (a *ArenaEngine) GetBounty(id string) (*Bounty, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	b, exists := a.Bounties[id]
	if !exists {
		return nil, fmt.Errorf("bounty %s not found", id)
	}
	return b, nil
}

func (a *ArenaEngine) GetReputation(user string) int {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.RepScores[user]
}

func (a *ArenaEngine) GetLeaderboard() map[string]int {
	a.mu.RLock()
	defer a.mu.RUnlock()

	// Return top 20
	result := make(map[string]int)
	count := 0
	for user, score := range a.RepScores {
		if count >= 20 {
			break
		}
		result[user] = score
		count++
	}
	return result
}

// ── Events ───────────────────────────────────────────────────────────────────

func (a *ArenaEngine) emitEvent(event ArenaEvent) {
	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("[Arena] [event marshal error] %v", err)
		return
	}

	// In production, publish to IPFS PubSub topic "arena-events"
	// curl -X POST "${IPFS_API}/pubsub/pub?arg=arena-events" --data-binary @-
	log.Printf("[Arena] [event] %s", string(data))

	// Log to structured audit
	log.Printf("[AUDIT_ARENA] %s | bounty=%s theorem=%s user=%s status=%s",
		event.Type, event.BountyID, event.Theorem, event.User, event.Status)
}

// ── Seed Crusade Sub-Bounties ────────────────────────────────────────────────

func (a *ArenaEngine) SeedCrusadeBounties(parentID string, subTheorems []string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	parent, exists := a.Bounties[parentID]
	if !exists {
		log.Printf("[Arena] Cannot seed crusade: parent %s not found", parentID)
		return
	}

	for i, sub := range subTheorems {
		subID := fmt.Sprintf("%s_sub_%d", parentID, i+1)
		difficulty := DiffMedium
		switch {
		case i < 5:
			difficulty = DiffEasy
		case i < 15:
			difficulty = DiffMedium
		default:
			difficulty = DiffHard
		}

		a.Bounties[subID] = &Bounty{
			ID:          subID,
			TheoremName: sub,
			Complexity:  difficulty,
			Mode:        ModeCrusade,
			RepReward:   50 + i*10,
			Status:      StatusOpen,
			CreatedAt:   time.Now(),
		}
		parent.SubBounties = append(parent.SubBounties, subID)
	}

	log.Printf("[Arena] 🗺️  CRUSADE SPAWNED: %s → %d sub-bounties",
		parent.TheoremName, len(subTheorems))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

func (a *ArenaEngine) DumpState() string {
	a.mu.RLock()
	defer a.mu.RUnlock()

	data, _ := json.MarshalIndent(map[string]interface{}{
		"bounties": a.Bounties,
		"scores":   a.RepScores,
	}, "", "  ")
	return string(data)
}

// Ensure rand is used (for future proof generation)
var _ = rand.Intn
