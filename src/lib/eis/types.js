const STATE_RANK = {
  PROVEN: 8,
  VERIFIED: 7,
  SUPPORTED: 6,
  OBSERVED: 5,
  INCONCLUSIVE: 4,
  UNVALIDATED: 2,
  UNTESTED: 1,
  STALE: 0,
  FALSIFIED: -1
};
const AUTH_THRESHOLD = "SUPPORTED";
const CLAIM_TYPE_RANK = {
  mathematical: 4,
  semantic: 3,
  empirical: 2,
  operational: 1
};
const EVIDENCE_SOURCES = [
  "you.com",
  "brave",
  "firecrawl",
  "watchdog"
];
export {
  AUTH_THRESHOLD,
  CLAIM_TYPE_RANK,
  EVIDENCE_SOURCES,
  STATE_RANK
};
