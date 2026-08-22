var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
const STORAGE_KEY = "vvu-interest-inception";
function emptyState() {
  return {
    completed: false,
    interest: null,
    interestCategory: null,
    bridgingPrompt: null,
    projectId: null,
    timestamp: null
  };
}
function loadInterestInception() {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return __spreadValues(__spreadValues({}, emptyState()), JSON.parse(raw));
  } catch (e) {
    return emptyState();
  }
}
function saveInterestInception(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function resetInterestInception() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
const INTEREST_QUICK_SELECTS = [
  { label: "Investing", value: "investing", emoji: "\u{1F4C8}" },
  { label: "Politics", value: "politics", emoji: "\u{1F3DB}\uFE0F" },
  { label: "Education", value: "education", emoji: "\u{1F393}" },
  { label: "Health", value: "health", emoji: "\u{1FA7A}" },
  { label: "Technology", value: "technology", emoji: "\u{1F4BB}" },
  { label: "Sports", value: "sports", emoji: "\u26BD" },
  { label: "Business", value: "business", emoji: "\u{1F4BC}" },
  { label: "Law", value: "law", emoji: "\u2696\uFE0F" },
  { label: "Science", value: "science", emoji: "\u{1F52C}" },
  { label: "Philosophy", value: "philosophy", emoji: "\u{1FA9E}" }
];
function classifyInterest(interest) {
  const i = interest.toLowerCase().trim();
  if (!i || i === "i don't know" || i === "i'm just curious" || i === "idk") return "unknown";
  const rules = [
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
    ["relationships", ["relationship", "family", "marriage", "friend", "partner", "love", "dating"]]
  ];
  for (const [cat, keywords] of rules) {
    if (keywords.some((kw) => i.includes(kw))) return cat;
  }
  return "other";
}
function generateProjectId(interest, timestamp) {
  const input = `${interest}::${timestamp}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i) | 0;
  }
  const base36 = Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `VVU-P-${base36}`;
}
function generateBridgingPrompt(interest, category) {
  const i = interest.trim() || "that";
  const templates = {
    investing: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific claim you've encountered about a stock, fund, or investment opportunity. Do you have a message, article, or statement you want to verify?`,
    politics: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific political claim you've encountered \u2014 a policy assertion, a candidate statement, or a news headline. Do you have a message, article, or statement you want to verify?`,
    education: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific educational claim \u2014 a grading decision, a curriculum assertion, or a learning outcome. Do you have a message, document, or statement you want to verify?`,
    health: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific health claim you've encountered \u2014 a treatment recommendation, a wellness trend, or a medical headline. Do you have a message, article, or statement you want to verify?`,
    technology: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific tech claim \u2014 a product assertion, a research finding, or an industry forecast. Do you have a message, article, or statement you want to verify?`,
    sports: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific sports claim \u2014 a performance assertion, a transfer rumor, or a tactical analysis. Do you have a message, article, or statement you want to verify?`,
    business: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific business claim \u2014 a market assertion, a startup pitch, or a strategic forecast. Do you have a message, article, or statement you want to verify?`,
    law: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific legal claim \u2014 a contract assertion, a regulatory interpretation, or a statutory reading. Do you have a message, document, or statement you want to verify?`,
    science: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific scientific claim \u2014 a research finding, a hypothesis, or a published result. Do you have a message, article, or paper you want to verify?`,
    philosophy: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific philosophical claim \u2014 an ethical assertion, a metaphysical position, or a moral argument. Do you have a message, text, or statement you want to examine?`,
    current_events: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific current-events claim you've encountered \u2014 a news headline, a viral social post, or a journalistic assertion. Do you have a message, article, or statement you want to verify?`,
    personal_finance: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific financial claim \u2014 a savings tip, a debt strategy, or a tax assertion. Do you have a message, article, or statement you want to verify?`,
    relationships: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific relational claim \u2014 a piece of advice, a generalization, or an assertion about human behavior. Do you have a message, article, or statement you want to examine?`,
    other: (interest2) => `Great. To explore "${interest2}", let's start by looking at a specific claim you've encountered about it. Do you have a message, article, or statement you want to verify?`,
    unknown: () => `Great. Let's start by looking at a specific claim you've encountered in the world \u2014 something you read, heard, or saw. Do you have a message, article, or statement you want to verify?`
  };
  return templates[category](i);
}
function categoryLabel(c) {
  const labels = {
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
    unknown: "Open Curiosity"
  };
  return labels[c];
}
function categoryEmoji(c) {
  const emojis = {
    investing: "\u{1F4C8}",
    politics: "\u{1F3DB}\uFE0F",
    education: "\u{1F393}",
    health: "\u{1FA7A}",
    technology: "\u{1F4BB}",
    sports: "\u26BD",
    business: "\u{1F4BC}",
    law: "\u2696\uFE0F",
    science: "\u{1F52C}",
    philosophy: "\u{1FA9E}",
    current_events: "\u{1F4F0}",
    personal_finance: "\u{1F4B0}",
    relationships: "\u2764\uFE0F",
    other: "\u2728",
    unknown: "\u{1F331}"
  };
  return emojis[c];
}
export {
  INTEREST_QUICK_SELECTS,
  categoryEmoji,
  categoryLabel,
  classifyInterest,
  emptyState,
  generateBridgingPrompt,
  generateProjectId,
  loadInterestInception,
  resetInterestInception,
  saveInterestInception
};
