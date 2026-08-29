import crypto from 'node:crypto';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_LOCATION = process.env.GCP_LOCATION ?? 'us-central1';
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

const EVIDENCE_OFFICE_SYSTEM_PROMPT = `You are the Evidence Office for the VVU institution.
You may only approve an RFC/ADR after every claim in it is either backed by
attached evidence (build hashes, test output, benchmark numbers) or is
clearly marked as a design proposal rather than a verified fact.
If evidence is missing for a material claim, you must say exactly what
evidence is missing and withhold approval — do not speculate on its likely
outcome. Your response must end with one of: VERDICT: APPROVED,
VERDICT: APPROVED WITH NOTED RISK, or VERDICT: REJECTED, followed by a
one-line reason.`;

const WILDCARD_SYSTEM_PROMPT = `You are the Wildcard reviewer for the VVU
institution. You have no fixed department and no obligation to be
diplomatic. Given an RFC/ADR and the Evidence Office's verdict on it, find
the single most concrete failure mode, edge case, or adversarial scenario
the verdict does not address — a race condition, a partition scenario, a
threshold that's fine on average but fails at the tail, a place a human
sign-off could be socially engineered. Ask one sharp, specific question.
Do not just repeat general concerns like "consider edge cases" — name one.`;

interface CouncilSessionResult {
  rfcId: string;
  evidenceOfficeVerdict: string;
  wildcardChallenge: string;
  transcript: string;
  transcriptHashSha256: string;
  timestamp: string;
}

async function callClaude(rfcText: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: EVIDENCE_OFFICE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rfcText }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.content.map((b: any) => b.text ?? '').join('\n');
}

async function callGemini(rfcText: string, evidenceOfficeVerdict: string): Promise<string> {
  const endpoint = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/publishers/google/models/${GEMINI_MODEL}:generateContent`;
  const accessToken = await getGcpAccessToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: WILDCARD_SYSTEM_PROMPT }] },
      contents: [{
        role: 'user',
        parts: [{ text: `RFC:\n${rfcText}\n\nEvidence Office verdict:\n${evidenceOfficeVerdict}` }],
      }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Vertex AI error: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('\n') ?? '';
}

async function getGcpAccessToken(): Promise<string> {
  const res = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } }
  );
  const json = await res.json();
  return json.access_token;
}

export async function runCouncilSession(rfcId: string, rfcText: string): Promise<CouncilSessionResult> {
  const evidenceOfficeVerdict = await callClaude(rfcText);
  const wildcardChallenge = await callGemini(rfcText, evidenceOfficeVerdict);

  const transcript = [
    `RFC: ${rfcId}`,
    `--- EVIDENCE OFFICE (Claude) ---`,
    evidenceOfficeVerdict,
    `--- WILDCARD (Gemini) ---`,
    wildcardChallenge,
  ].join('\n\n');

  const transcriptHashSha256 = crypto.createHash('sha256').update(transcript).digest('hex');

  return {
    rfcId,
    evidenceOfficeVerdict,
    wildcardChallenge,
    transcript,
    transcriptHashSha256,
    timestamp: new Date().toISOString(),
  };
}

export async function vvuCouncilSession(req: any, res: any) {
  try {
    const { rfcId, rfcText } = req.body ?? {};
    if (!rfcId || !rfcText) {
      res.status(400).json({ success: false, error: 'rfcId and rfcText are required' });
      return;
    }
    const result = await runCouncilSession(rfcId, rfcText);
    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? String(err) });
  }
}
