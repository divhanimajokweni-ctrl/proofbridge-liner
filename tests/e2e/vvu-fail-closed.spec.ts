import { test, expect } from "@playwright/test";

/**
 * VVU Fail-Closed Valve — End-to-End Test Walk (Section 9)
 *
 * Programmatically:
 *   1. Navigate to the IVE workspace overview.
 *   2. Reset every claim to a known baseline (revoke all + reset all
 *      breakers) so the IVE verdict is UNKNOWN → matrix stage = 2
 *      (web-spider, NORMAL breaker).
 *   3. Click "All GO" — authorises every claim + resets every breaker.
 *      The IVE verdict flips to PROVEN → matrix morphs to Miles
 *      (stage 3).
 *   4. Assert the Evolution Matrix's data-stage attribute is "3"
 *      and data-breaker is "NORMAL".
 *   5. Trip a breaker via the API (operator fault or EIS Theorem-5
 *      evidence-lost event).
 *   6. Assert the matrix drops back to stage "2" with data-breaker
 *      "TRIPPED" — pulsing-red INCONCLUSIVE.
 *
 * This proves Theorem 5's fail-closed bound end-to-end at the UI
 * layer: a tripped breaker forces IVE back to INCONCLUSIVE even
 * though every claim is still authorised.
 */

const THEOREM_STATE_URL = "/api/theorem-state";

test("VVU Fail-Closed Valve — All GO → Miles → breaker trip → pulsing-red INCONCLUSIVE", async ({
  page,
}) => {
  // ── Step 1: navigate to the dashboard.
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // ── Step 2: baseline — reset all claims + breakers via the Reset button.
  const resetBtn = page.locator('[data-test="reset-all"]');
  await resetBtn.waitFor({ state: "visible", timeout: 15_000 });
  await expect(async () => {
    const disabled = await resetBtn.getAttribute("disabled");
    expect(disabled).toBeNull();
  }).toPass({ timeout: 5_000 });
  await resetBtn.click();

  // Wait for the server's theorem-state to reflect UNKNOWN + NORMAL.
  await expect.poll(
    async () => {
      const r = await page.request.get(THEOREM_STATE_URL);
      const j = await r.json().catch(() => ({}));
      return j.iveVerdict;
    },
    { timeout: 15_000, intervals: [500, 1000, 2000] }
  ).toBe("UNKNOWN");

  // ── Step 3: click "All GO".
  const allGoBtn = page.locator('[data-test="all-go"]');
  await allGoBtn.waitFor({ state: "visible" });
  await expect(async () => {
    const disabled = await allGoBtn.getAttribute("disabled");
    expect(disabled).toBeNull();
  }).toPass({ timeout: 5_000 });
  await allGoBtn.click();

  // ── Step 4: verify the matrix morphed to Miles (stage 3, NORMAL breaker).
  await expect.poll(
    async () => {
      const r = await page.request.get(THEOREM_STATE_URL);
      const j = await r.json().catch(() => ({}));
      return { ive: j.iveVerdict, breaker: j.breaker };
    },
    { timeout: 15_000, intervals: [500, 1000, 2000] }
  ).toEqual({ ive: "PROVEN", breaker: "NORMAL" });

  // The matrix container exposes data-stage + data-breaker for tests.
  const matrix = page.locator('[data-test="evolution-matrix"]').first();
  await expect(matrix).toHaveAttribute("data-stage", "3", { timeout: 15_000 });
  await expect(matrix).toHaveAttribute("data-breaker", "NORMAL");

  // ── Step 5: trip a breaker via the API (operator fault / Theorem 5).
  const stateRes = await page.request.get(THEOREM_STATE_URL);
  const stateJson = await stateRes.json();
  const firstClaim = stateJson.iveClaims?.[0];
  expect(firstClaim, "IVE must have at least one claim to trip").toBeTruthy();

  const tripRes = await page.request.post(
    `/api/theorem-state/claims/${encodeURIComponent(firstClaim.id)}/breaker`,
    { data: { tripped: true, reason: "operator_override" } }
  );
  expect(tripRes.ok(), `breaker trip must succeed: ${tripRes.status()}`).toBe(true);

  // ── Step 6: assert the matrix dropped to pulsing-red INCONCLUSIVE.
  await expect.poll(
    async () => {
      const r = await page.request.get(THEOREM_STATE_URL);
      const j = await r.json().catch(() => ({}));
      return { ive: j.iveVerdict, breaker: j.breaker };
    },
    { timeout: 15_000, intervals: [500, 1000, 2000] }
  ).toEqual({ ive: "INCONCLUSIVE", breaker: "TRIPPED" });

  await expect(matrix).toHaveAttribute("data-stage", "2", { timeout: 15_000 });
  await expect(matrix).toHaveAttribute("data-breaker", "TRIPPED");

  // Final visual assertion — the badge in the IVE injector reads
  // "valve tripped · pulsing red".
  const valveBadge = page.locator("text=valve tripped").first();
  await expect(valveBadge).toBeVisible({ timeout: 5_000 });
});
