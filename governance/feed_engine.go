// feed_engine.go — Village Feed Algorithm (The "For You" Page)
//
// The CRAFT-powered discovery engine that serves as the TikTok-style
// algorithmic feed for the Village Dashboard.
//
// It connects to Milvus to find active bounties that match the user's
// skill profile, recent activity, and reputation level, then ranks them
// by "Viral Potential" (engagement velocity).
//
// Architecture:
//   User Activity → Embedding via CRAFT → Milvus Similarity Search →
//   Rank by Engagement → Serve Feed Cards via API
//
// The feed engine runs inside the Lindiwe container and exposes a
// lightweight HTTP endpoint for the VillageFrontend to consume.

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"sort"
	"time"
)

// ── Feed Types ────────────────────────────────────────────────────────────────

type FeedItemType string

const (
	FeedSiege       FeedItemType = "SIEGE"
	FeedGolf        FeedItemType = "GOLF"
	FeedCrusade     FeedItemType = "CRUSADE"
	FeedStream      FeedItemType = "STREAM"
	FeedMilestone   FeedItemType = "MILESTONE"
	FeedGovernance  FeedItemType = "GOVERNANCE"
)

// FeedItem is the API response model for the Village frontend.
type FeedItem struct {
	ID              string       `json:"id"`
	Type            FeedItemType `json:"type"`
	Title           string       `json:"title"`
	Description     string       `json:"description"`
	Author          string       `json:"author"`
	Bounty          int          `json:"bounty"`
	Signatures      int          `json:"signatures"`
	UserHasVerified bool         `json:"userHasVerified"`
	TraceCID        string       `json:"trace,omitempty"`
	Timestamp       int64        `json:"timestamp"`
	TVector         []float32   `json:"-"` // internal: embedding vector
	ActivePlayers   int          `json:"-"`
}

// UserProfile is the internal representation used for personalisation.
type UserProfile struct {
	UserID        string
	RepScore      int
	Rank          string // Neophyte, Scholar, Prover, Architect
	RecentCIDs    []string // Last 5 proofs interacted with
	SkillVector   []float32 // CRAFT embedding of user's skill set
}

// ── Feed Engine ───────────────────────────────────────────────────────────────

type FeedEngine struct {
	items    []*FeedItem
	milvusURL string
}

func NewFeedEngine(milvusURL string) *FeedEngine {
	engine := &FeedEngine{
		milvusURL: milvusURL,
	}
	engine.seedContent()
	return engine
}

// seedContent populates the feed with initial game content derived from
// the Arena bounties plus additional social/stream items.
func (fe *FeedEngine) seedContent() {
	now := time.Now()

	// Pull active bounties from the Arena engine
	arenaBounties := arenaEngine.ListBounties()
	for _, b := range arenaBounties {
		item := &FeedItem{
			ID:          fmt.Sprintf("feed_%s", b.ID),
			Title:       b.TheoremName,
			Description: fmt.Sprintf("%s bounty · %s mode", b.Complexity, b.Mode),
			Author:      b.BlueClaimant,
			Bounty:      b.RepReward,
			Signatures:  rand.Intn(50),
			Timestamp:   now.Add(-time.Duration(rand.Intn(72)) * time.Hour).UnixMilli(),
			ActivePlayers: rand.Intn(20),
		}

		switch b.Mode {
		case ModeSiege:
			item.Type = FeedSiege
			if item.Author == "" {
				item.Author = "@Anonymous_Blue"
			}
		case ModeGolf:
			item.Type = FeedGolf
			if item.Author == "" {
				item.Author = "@Speedrunner"
			}
		case ModeCrusade:
			item.Type = FeedCrusade
			if item.Author == "" {
				item.Author = "@Raid_Leader"
			}
		}
		fe.items = append(fe.items, item)
	}

	// Add social/community items
	socialItems := []*FeedItem{
		{
			ID: "stream_1", Type: FeedStream,
			Title:       "Live Coding: Proving Fermat's Little Theorem",
			Description: "Watch a 5-line proof in real-time. Tips = compute credits.",
			Author:      "@Streamer_Math",
			Signatures:  230,
			Timestamp:   now.Add(-2 * time.Hour).UnixMilli(),
			ActivePlayers: 42,
		},
		{
			ID: "milestone_1", Type: FeedMilestone,
			Title:       "👑 @Tokyo_Node hit 10k REP — Architect Rank!",
			Description: "Lindiwe Oracle certified. Governance voting rights with 10x weight.",
			Author:      "@Lindiwe_Bot",
			Signatures:  89,
			Timestamp:   now.Add(-4 * time.Hour).UnixMilli(),
		},
		{
			ID: "gov_1", Type: FeedGovernance,
			Title:       "🗳️ HARD FORK PROPOSAL: Add Excluded Middle?",
			Description: "Vote now: Should the pool axiom set include LEM? Architects only.",
			Author:      "@Gov_DAO",
			Signatures:  34,
			Timestamp:   now.Add(-8 * time.Hour).UnixMilli(),
		},
		{
			ID: "stream_2", Type: FeedStream,
			Title:       "🎮 Arena Grand Finals: @Tokyo_Node vs @Oxford_Lab",
			Description: "Live siege match. 5k REP on the line. Spectator client open.",
			Author:      "@UbuntuGames",
			Bounty:      5000,
			Signatures:  1200,
			Timestamp:   now.Add(-25 * time.Hour).UnixMilli(),
			ActivePlayers: 156,
		},
	}
	fe.items = append(fe.items, socialItems...)

	log.Printf("[FeedEngine] Seeded %d feed items", len(fe.items))
}

// GetFeedForUser generates a personalised "For You" page.
//
// Algorithm:
//   1. If the user has a skill vector, query Milvus for similar active bounties
//   2. Boost items with high engagement velocity (ActivePlayers / time since posted)
//   3. Interleave social content (streams, milestones, governance)
//   4. Return top N items
func (fe *FeedEngine) GetFeedForUser(userID string, limit int) []*FeedItem {
	_ = userID // In production: userID → Milvus embedding query

	// In development: sort by engagement velocity + randomness
	ranked := make([]*FeedItem, len(fe.items))
	copy(ranked, fe.items)

	sort.SliceStable(ranked, func(i, j int) bool {
		// Primary: active players (engagement)
		if ranked[i].ActivePlayers != ranked[j].ActivePlayers {
			return ranked[i].ActivePlayers > ranked[j].ActivePlayers
		}
		// Secondary: recency
		return ranked[i].Timestamp > ranked[j].Timestamp
	})

	if limit <= 0 || limit > len(ranked) {
		limit = len(ranked)
	}
	return ranked[:limit]
}

// GetFeedForType returns items filtered by type (for tabbed browsing).
func (fe *FeedEngine) GetFeedForType(itemType FeedItemType, limit int) []*FeedItem {
	var filtered []*FeedItem
	for _, item := range fe.items {
		if item.Type == itemType {
			filtered = append(filtered, item)
		}
	}

	sort.SliceStable(filtered, func(i, j int) bool {
		return filtered[i].Timestamp > filtered[j].Timestamp
	})

	if limit <= 0 || limit > len(filtered) {
		limit = len(filtered)
	}
	return filtered[:limit]
}

// GetTrending returns items with the highest recent engagement.
func (fe *FeedEngine) GetTrending(limit int) []*FeedItem {
	ranked := make([]*FeedItem, len(fe.items))
	copy(ranked, fe.items)

	sort.SliceStable(ranked, func(i, j int) bool {
		return ranked[i].Signatures > ranked[j].Signatures
	})

	if limit <= 0 || limit > len(ranked) {
		limit = len(ranked)
	}
	return ranked[:limit]
}

// ── HTTP Handler (called by lindiwe main) ─────────────────────────────────────

// HandleFeedRequest parses the query and returns JSON.
// In production, this would be served via an embedded HTTP server.
func (fe *FeedEngine) HandleFeedRequest(userID string, itemType string, limit int) (string, error) {
	var items []*FeedItem

	switch itemType {
	case "trending":
		items = fe.GetTrending(limit)
	case "siege", "golf", "crusade", "stream", "milestone", "governance":
		items = fe.GetFeedForType(FeedItemType(itemType), limit)
	default:
		items = fe.GetFeedForUser(userID, limit)
	}

	data, err := json.Marshal(map[string]interface{}{
		"items":      items,
		"count":      len(items),
		"user_id":    userID,
		"generated_at": time.Now().UTC().Format(time.RFC3339),
	})
	if err != nil {
		return "", fmt.Errorf("marshal error: %w", err)
	}

	return string(data), nil
}

// ── Global singleton (initialised from lindiwe.go) ────────────────────────────

var feedEngine *FeedEngine

func InitFeedEngine(milvusURL string) {
	feedEngine = NewFeedEngine(milvusURL)
	log.Printf("[FeedEngine] Initialised with Milvus: %s", milvusURL)
}

// Ensure rand is used
var _ = rand.Intn
