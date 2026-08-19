/**
 * Interest Inception State — curiosity-first onboarding state machine.
 *
 * The immutable entry point for every VVU user is a single question:
 *   "What are you interested in?"
 *
 * This module owns:
 *   - localStorage persistence of the inception state
 *   - Heuristic interest classifier (15 categories + "unknown")
 *   - Bridging-prompt generator (links the user's world to IVE's world)
 *   - Deterministic implicit project ID generator
 *
 * AI router (if configured) can refine the classification and the
 * bridging prompt; this module is the always-available fallback.
 *
 * Locked per Charter Article XII §12.4 — UX invariant for the Study
 * Release. "No user ever sees a 'project' or 'claim' or 'evidence'
 * field before they've answered one question: What are you interested in?"
 */

export type InterestCategory =
  | "investing"
  | "politics"
  | "education"
  | "health"
  | "technology"
  | "sports"
  | "business"
  | "law"
  | "science"
  | "philosophy"
  | "current_events"
  | "personal_finance"
  | "relationships"
  | "other"
  | "unknown"; // "I don't know, I'm just curious"

export interface InterestInceptionState {
  completed: boolean;
  interest: string | null;
  interestCategory: InterestCategory | null;
  bridgingPrompt: string | null;
  projectId: string | null;
  timestamp: string | null;
}

const STORAGE_KEY = "vvu-interest-inception";

export function emptyState(): InterestInceptionState {
  return {
    completed: false,
    interest: null,
    interestCategory: null,
    bridgingPrompt: null,
    projectId: null,
    timestamp: null,
  };
}

export function loadInterestInception(): InterestInceptionState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...(JSON.parse(raw) as Partial<InterestInceptionState>) };
  } catch {
    return emptyState();
  }
}

export function saveInterestInception(state: InterestInceptionState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetInterestInception(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Quick-select chips shown below the free-text input.
 * Order matters — most-common first.
 */
export const INTEREST_QUICK_SELECTS: { label: string; value: InterestCategory; emoji: string }[] = [
  { label: "Investing", value: "investing", emoji: "📈" },
  { label: "Politics", value: "politics", emoji: "🏛️" },
  { label: "Education", value: "education", emoji: "🎓" },
  { label: "Health", value: "health", emoji: "🩺" },
  { label: "Technology", value: "technology", emoji: "💻" },
  { label: "Sports", value: "sports", emoji: "⚽" },
  { label: "Business", value: "business", emoji: "💼" },
  { label: "Law", value: "law", emoji: "⚖️" },
  { label: "Science", value: "science", emoji: "🔬" },
  { label: "Philosophy", value: "philosophy", emoji: "🪞" },
];

/**
 * Local heuristic classifier. The AI router can override via /api/studi/interest,
 * but this is the always-available fallback per Charter Article XIII §13.3
 * (extracted state is UI affordance only — NOT epistemic verification).
 */
export function classifyInterest(interest: string): InterestCategory {
  const i = interest.toLowerCase().trim();
  if (!i || i === "i don't know" || i === "i'm just curious" || i === "idk") return "unknown";

  const rules: [InterestCategory, string[]][] = [
    ["investing", ["invest", "stock", "crypto", "bitcoin", "portfolio", "etf", "fund", "asset", "dividend", "trading", "market"]],
    ["politics", ["politic", "election", "government", "policy", "parliament", "president", "vote", "democracy", "party", "candidate"]],
    ["education", ["education", "school", "university", "learn", "teach", "study", "curriculum", "rubric", "grade", "marking", "essay", "student"]],
    ["health", ["health", "medical", "doctor", "disease", "medicine", "wellness", "nutrition", "fitness", "mental", "diet", "cancer", "treatment"]],
    ["technology", ["tech", "ai ", "ai,", "software", "code", "programming", "computer", "internet", "data", "cloud", "robot", "algorithm"]],
    ["sports", ["sport", "football", "soccer", "cricket", "rugby", "tennis", "olympic", "athlete", "team", "player", "match"]],
    ["business", ["business", "startup", "entrepreneur", "market", "sales", "strategy", "company", "venture", "founder"]],
    ["law", ["law", "legal", "court", "contract", "compliance", "regulation", "statute", "judge", "attorney"]],
    ["science", ["science", "research", "experiment", "physics", "chemistry", "biology", "study", "hypothesis", "peer-review"]],
    ["philosophy", ["philosophy", "ethic", "moral", "meaning", "truth", "existence", "consciousness", "virtue"]],
    ["current_events", ["news", "current", "today", "latest", "breaking", "headline", "world"]],
    ["personal_finance", ["money", "budget", "saving", "debt", "loan", "retirement", "tax", "income"]],
    ["relationships", ["relationship", "family", "marriage", "friend", "partner", "love", "dating"]],
  ];

  for (const [cat, keywords] of rules) {
    if (keywords.some((kw) => i.includes(kw))) return cat;
  }
  return "other";
}

/**
 * Deterministic project ID generator.
 * The project is created implicitly from the user's interest — there is no
 * separate "create project" step. Per operator spec §1.
 */
export function generateProjectId(interest: string, timestamp: string): string {
  const input = `${interest}::${timestamp}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  const base36 = Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `VVU-P-${base36}`;
}

/**
 * The bridging prompt — the line of argument from the user's world to IVE's
 * world. Every category has its own template; "unknown" gets the universal
 * template that doesn't presume a domain.
 */
export function generateBridgingPrompt(interest: string, category: InterestCategory): string {
  const i = interest.trim() || "that";
  const templates: Record<InterestCategory, (i: string) => string> = {
    investing: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific claim you've encountered about a stock, fund, or investment opportunity. Do you have a message, article, or statement you want to verify?`,
    politics: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific political claim you've encountered — a policy assertion, a candidate statement, or a news headline. Do you have a message, article, or statement you want to verify?`,
    education: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific educational claim — a grading decision, a curriculum assertion, or a learning outcome. Do you have a message, document, or statement you want to verify?`,
    health: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific health claim you've encountered — a treatment recommendation, a wellness trend, or a medical headline. Do you have a message, article, or statement you want to verify?`,
    technology: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific tech claim — a product assertion, a research finding, or an industry forecast. Do you have a message, article, or statement you want to verify?`,
    sports: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific sports claim — a performance assertion, a transfer rumor, or a tactical analysis. Do you have a message, article, or statement you want to verify?`,
    business: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific business claim — a market assertion, a startup pitch, or a strategic forecast. Do you have a message, article, or statement you want to verify?`,
    law: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific legal claim — a contract assertion, a regulatory interpretation, or a statutory reading. Do you have a message, document, or statement you want to verify?`,
    science: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific scientific claim — a research finding, a hypothesis, or a published result. Do you have a message, article, or paper you want to verify?`,
    philosophy: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific philosophical claim — an ethical assertion, a metaphysical position, or a moral argument. Do you have a message, text, or statement you want to examine?`,
    current_events: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific current-events claim you've encountered — a news headline, a viral social post, or a journalistic assertion. Do you have a message, article, or statement you want to verify?`,
    personal_finance: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific financial claim — a savings tip, a debt strategy, or a tax assertion. Do you have a message, article, or statement you want to verify?`,
    relationships: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific relational claim — a piece of advice, a generalization, or an assertion about human behavior. Do you have a message, article, or statement you want to examine?`,
    other: (interest) =>
      `Great. To explore "${interest}", let's start by looking at a specific claim you've encountered about it. Do you have a message, article, or statement you want to verify?`,
    unknown: () =>
      `Great. Let's start by looking at a specific claim you've encountered in the world — something you read, heard, or saw. Do you have a message, article, or statement you want to verify?`,
  };

  return templates[category](i);
}

/**
 * Category label (human-readable, for UI display).
 */
export function categoryLabel(c: InterestCategory): string {
  const labels: Record<InterestCategory, string> = {
    investing: "Investing",
    politics: "Politics",
    education: "Education",
    health: "Health",
    technology: "Technology",
    sports: "Sports",
    business: "Business",
    law: "Law",
    science: "Science",
    philosophy: "Philosophy",
    current_events: "Current Events",
    personal_finance: "Personal Finance",
    relationships: "Relationships",
    other: "General Interest",
    unknown: "Open Curiosity",
  };
  return labels[c];
}

/**
 * Category emoji (for quick visual recognition in the UI).
 */
export function categoryEmoji(c: InterestCategory): string {
  const emojis: Record<InterestCategory, string> = {
    investing: "📈",
    politics: "🏛️",
    education: "🎓",
    health: "🩺",
    technology: "💻",
    sports: "⚽",
    business: "💼",
    law: "⚖️",
    science: "🔬",
    philosophy: "🪞",
    current_events: "📰",
    personal_finance: "💰",
    relationships: "❤️",
    other: "✨",
    unknown: "🌱",
  };
  return emojis[c];
}
