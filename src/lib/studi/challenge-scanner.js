function scanClaim(claim, evidence) {
  const challenges = [];
  const c1 = detectContradiction(claim, evidence);
  if (c1) challenges.push(c1);
  const c2 = detectUnsupportedAssumption(claim, evidence);
  if (c2) challenges.push(c2);
  const c3 = detectAlternativeExplanation(claim, evidence);
  if (c3) challenges.push(c3);
  const c4 = detectOverconfidence(claim, evidence);
  if (c4) challenges.push(c4);
  return challenges.sort((a, b) => b.confidence - a.confidence);
}
function detectContradiction(claim, evidence) {
  if (!evidence) return null;
  const claimLower = claim.toLowerCase();
  const evidenceLower = evidence.toLowerCase();
  const claimConfident = /\b(will|definitely|certainly|guaranteed|proven|always|never|cannot|must)\b/.test(claimLower);
  const evidenceHedged = /\b(may|might|could|possibly|perhaps|likely|uncertain|tentative|preliminary|appears to|seems to)\b/.test(evidenceLower);
  const claimPercent = claimLower.match(/(\d+)\s*%/);
  const evidencePercent = evidenceLower.match(/(\d+)\s*%/);
  const numericContradiction = claimPercent && evidencePercent && Math.abs(parseInt(claimPercent[1]) - parseInt(evidencePercent[1])) >= 25;
  if (!claimConfident && !numericContradiction) return null;
  if (!evidenceHedged && !numericContradiction) return null;
  return {
    id: `ch-contradiction-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "contradiction",
    title: "Contradiction detected",
    description: "Your claim uses certainty language, but your evidence uses hedging language. These cannot both be true at the same confidence level.",
    claim_excerpt: extractExcerpt(
      claim,
      /\b(will|definitely|certainly|guaranteed|proven|always|never|cannot|must)\b/i
    ),
    evidence_excerpt: extractExcerpt(
      evidence,
      /\b(may|might|could|possibly|perhaps|likely|uncertain|tentative|preliminary|appears to|seems to)\b/i
    ),
    assessment: "The claim asserts certainty that the evidence does not support. Either the claim must be softened to match the evidence, or stronger evidence must be provided that establishes the certainty.",
    suggested_responses: [
      "Provide stronger evidence that establishes the certainty",
      "Adjust the claim to match the hedged language of the evidence",
      "Proceed with the lower confidence level"
    ],
    confidence: numericContradiction ? 0.9 : 0.8
  };
}
function detectUnsupportedAssumption(claim, evidence) {
  var _a;
  const claimLower = claim.toLowerCase();
  const connectorMatch = claimLower.match(
    /\b(because|since|therefore|so|thus|means that|implies that|leads to the conclusion)\b/
  );
  if (!connectorMatch || connectorMatch.index === void 0) return null;
  const premiseEnd = connectorMatch.index;
  const premise = claim.substring(0, premiseEnd).trim();
  if (premise.length < 15) return null;
  const premiseKeywords = extractKeywords(premise);
  const evidenceLower = (_a = evidence == null ? void 0 : evidence.toLowerCase()) != null ? _a : "";
  const evidenceEstablishes = premiseKeywords.length > 0 ? premiseKeywords.some((kw) => evidenceLower.includes(kw)) : false;
  if (evidenceEstablishes) return null;
  return {
    id: `ch-unsupported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "unsupported_assumption",
    title: "Unsupported assumption",
    description: `Your claim treats "${truncate(premise, 60)}" as established, but no evidence is provided to establish it. Please provide support for this premise.`,
    claim_excerpt: truncate(premise, 80),
    evidence_excerpt: evidence ? truncate(evidence, 80) : null,
    assessment: "The reasoning chain depends on a premise that has not been independently verified. In epistemic verification, every link in the chain must be supported \u2014 not just the conclusion.",
    suggested_responses: [
      "Provide evidence that supports the premise",
      "Adjust the claim to remove the unsupported premise",
      "Proceed, acknowledging the premise is unsupported"
    ],
    confidence: 0.7
  };
}
function detectAlternativeExplanation(claim, evidence) {
  var _a;
  const claimLower = claim.toLowerCase();
  const causalTerms = /\b(causes?|leads to|results in|makes|forces?|drives|produces|creates|generates|brings about)\b/;
  if (!causalTerms.test(claimLower)) return null;
  const causalEstablishmentTerms = /\b(randomized|controlled trial|experiment|causal|mechanism| placebo|double-blind)\b/i;
  const evidenceLower = (_a = evidence == null ? void 0 : evidence.toLowerCase()) != null ? _a : "";
  if (causalEstablishmentTerms.test(evidenceLower)) return null;
  const correlationTerms = /\b(correlat|association|relat|link|connect|tie|pattern|co-occur)\b/i;
  const anecdotalTerms = /\b(story|anecdote|testimoni|friend|my|i saw|i heard|screenshot|whatsapp|telegram|social media)\b/i;
  const isCorrelational = correlationTerms.test(evidenceLower);
  const isAnecdotal = anecdotalTerms.test(evidenceLower);
  const weakEvidence = !evidence || evidence.length < 150 || isCorrelational || isAnecdotal;
  if (!weakEvidence) return null;
  return {
    id: `ch-alternative-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "alternative_explanation",
    title: "Alternative explanation possible",
    description: "Your claim asserts a causal relationship, but the evidence provided does not establish causation. Correlation, coincidence, or a third variable could explain the same observation.",
    claim_excerpt: extractExcerpt(claim, causalTerms),
    evidence_excerpt: isCorrelational ? extractExcerpt(evidence != null ? evidence : "", correlationTerms) : evidence ? truncate(evidence, 80) : null,
    assessment: "Causal claims require either (a) a randomized controlled trial, (b) a mechanistic explanation, or (c) triangulation across multiple independent methods. Without one of these, alternative explanations cannot be ruled out.",
    suggested_responses: [
      "Provide evidence from a controlled experiment or mechanistic study",
      "Adjust the claim to assert correlation rather than causation",
      "List the alternative explanations and explain why each is less likely"
    ],
    confidence: 0.75
  };
}
function detectOverconfidence(claim, evidence) {
  var _a;
  const claimLower = claim.toLowerCase();
  const overconfidentWords = /\b(definitely|certainly|absolutely|guaranteed|100%|proven|fact|undoubtedly|will double|will triple|will make rich|sure thing|can't lose)\b/i;
  const numericallyOverconfident = /\b(\d+%\s+(?:sure|certain|confident)|\d+x\s+(?:growth|return|profit|gain))\b/i;
  const isOverconfident = overconfidentWords.test(claimLower) || numericallyOverconfident.test(claimLower);
  if (!isOverconfident) return null;
  const evidenceLower = (_a = evidence == null ? void 0 : evidence.toLowerCase()) != null ? _a : "";
  const weakEvidenceIndicators = /^screenshot of|whatsapp|telegram|social media|instagram|tiktok|facebook post|tweet|my friend|i heard|someone said/i;
  const weakEvidence = !evidence || evidence.length < 100 || weakEvidenceIndicators.test(evidenceLower);
  if (!weakEvidence) return null;
  return {
    id: `ch-overconfidence-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "overconfidence",
    title: "Overconfidence relative to evidence",
    description: "Your claim uses strong certainty language or specific numerical projections, but the evidence provided does not support that level of confidence.",
    claim_excerpt: extractExcerpt(claim, overconfidentWords),
    evidence_excerpt: evidence ? truncate(evidence, 120) : null,
    assessment: "Calibrate your confidence to the evidence. Anecdotes, screenshots, and social media messages support, at best, 20-40% confidence \u2014 not certainty. Adjust either the claim or the evidence.",
    suggested_responses: [
      "Provide stronger, independent evidence (peer-reviewed study, official data, expert consensus)",
      "Adjust the claim to a more modest assertion",
      "Proceed, explicitly acknowledging the low confidence level"
    ],
    confidence: 0.85
  };
}
function extractExcerpt(text, pattern) {
  const match = text.match(pattern);
  if (!match || match.index === void 0) return truncate(text, 80);
  const start = Math.max(0, match.index - 30);
  const end = Math.min(text.length, match.index + match[0].length + 30);
  return `\u2026${text.substring(start, end).trim()}\u2026`;
}
function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.substring(0, max - 1)}\u2026`;
}
function extractKeywords(text) {
  var _a;
  const stopwords = /* @__PURE__ */ new Set([
    "the",
    "and",
    "but",
    "for",
    "with",
    "that",
    "this",
    "from",
    "have",
    "will",
    "their",
    "there",
    "they",
    "were",
    "would",
    "could",
    "should",
    "might",
    "shall",
    "must",
    "been",
    "being",
    "have",
    "has",
    "had",
    "does",
    "did",
    "what",
    "when",
    "where",
    "which",
    "while",
    "your",
    "yours",
    "about"
  ]);
  const words = (_a = text.toLowerCase().match(/[a-z]{5,}/g)) != null ? _a : [];
  return Array.from(new Set(words.filter((w) => !stopwords.has(w)))).slice(0, 5);
}
function challengeTypeLabel(t) {
  switch (t) {
    case "contradiction":
      return "Contradiction";
    case "unsupported_assumption":
      return "Unsupported Assumption";
    case "alternative_explanation":
      return "Alternative Explanation";
    case "overconfidence":
      return "Overconfidence";
  }
}
function challengeTypeEmoji(t) {
  switch (t) {
    case "contradiction":
      return "\u26A1";
    case "unsupported_assumption":
      return "\u{1F50D}";
    case "alternative_explanation":
      return "\u{1F500}";
    case "overconfidence":
      return "\u{1F4CA}";
  }
}
function responseTypeLabel(r) {
  switch (r) {
    case "provide_stronger_evidence":
      return "Provide stronger evidence";
    case "adjust_claim":
      return "Adjust the claim";
    case "proceed_with_uncertainty":
      return "Proceed with this uncertainty level";
    case "abandon_claim":
      return "Abandon the claim";
  }
}
function resolutionLabel(r) {
  switch (r) {
    case "verified":
      return "Verified";
    case "unresolved":
      return "Unresolved";
    case "revised":
      return "Revised";
    case "abandoned":
      return "Abandoned";
    case "pending":
      return "Pending";
  }
}
export {
  challengeTypeEmoji,
  challengeTypeLabel,
  resolutionLabel,
  responseTypeLabel,
  scanClaim
};
