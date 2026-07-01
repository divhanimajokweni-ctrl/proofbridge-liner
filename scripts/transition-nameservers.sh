#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# VVU — Nameserver Transition: Host Africa → Vercel DNS
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

DOMAIN="venturevisionubuntu.co.za"
CURRENT_NS_TARGET="ns1.host-ww.net"
VERCEL_NS1="ns1.vercel-dns.com"
VERCEL_NS2="ns2.vercel-dns.com"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  VVU Nameserver Transition Check${NC}"
echo -e "${CYAN}  Domain: ${DOMAIN}${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ── Step 1: Resolve current authoritative nameservers ─────────────────────
echo -e "${YELLOW}[1/5]${NC} Checking current authoritative nameservers..."
CURRENT_NS=$(node -e "
  const dns = require('dns');
  dns.resolveNs('${DOMAIN}', (err, addrs) => {
    if (err) { console.error(err.code); process.exit(1); }
    console.log(addrs.join(' '));
  });
" 2>/dev/null || echo "UNRESOLVABLE")

echo "       Current NS: ${CURRENT_NS}"

if [[ "$CURRENT_NS" == "UNRESOLVABLE" ]]; then
  echo -e "       ${YELLOW}⚠  Domain not resolving — may be freshly registered or NS change in progress.${NC}"
fi

# ── Step 2: Check if already on Vercel DNS ────────────────────────────────
if echo "$CURRENT_NS" | grep -q "vercel-dns"; then
  echo -e "       ${GREEN}✅ Nameservers already point to Vercel DNS. No action needed.${NC}"
  VERIZ_ON_VERCEL=true
else
  echo -e "       ${RED}✘  Still on Host Africa nameservers.${NC}"
  VERIZ_ON_VERCEL=false
fi
echo ""

# ── Step 3: Verify Vercel domain configuration ────────────────────────────
echo -e "${YELLOW}[2/5]${NC} Verifying Vercel domain configuration..."
if command -v vercel &>/dev/null; then
  VERCEL_DOMAIN_INFO=$(vercel domains inspect ${DOMAIN} 2>/dev/null || true)
  if echo "$VERCEL_DOMAIN_INFO" | grep -q "Intended Nameservers"; then
    echo -e "       ${GREEN}✅ Domain is configured on Vercel.${NC}"
    echo -e "       Intended NS: ns1.vercel-dns.com / ns2.vercel-dns.com"
  else
    echo -e "       ${RED}✘  Domain not found in Vercel. Run: vercel domains add ${DOMAIN} proofbridge-liner${NC}"
  fi
else
  echo -e "       ${YELLOW}⚠  Vercel CLI not available — skipping.${NC}"
fi
echo ""

# ── Step 4: Verify zone file ──────────────────────────────────────────────
echo -e "${YELLOW}[3/5]${NC} Checking local zone file..."
ZONE_FILE="venturevisionubuntu.co.za.zone"
if [[ -f "$ZONE_FILE" ]]; then
  ZONE_NS=$(grep "^@.*IN.*NS" "$ZONE_FILE" | awk '{print $5}' | tr '\n' ' ')
  echo -e "       ${GREEN}✅ Zone file found: ${ZONE_FILE}${NC}"
  echo -e "       Zone configured NS: ${ZONE_NS}"
  if echo "$ZONE_NS" | grep -q "vercel-dns"; then
    echo -e "       ${GREEN}✅ Zone file targets Vercel DNS.${NC}"
  fi
else
  echo -e "       ${RED}✘  Zone file missing!${NC}"
fi
echo ""

# ── Step 5: Print executable transition plan ──────────────────────────────
echo -e "${YELLOW}[4/5]${NC} Current DNS resolution test..."
node -e "
  const dns = require('dns');
  dns.resolve4('${DOMAIN}', (err, addrs) => {
    if (err) console.log('       A record: UNRESOLVABLE');
    else console.log('       A record: ' + addrs.join(', '));
  });
  dns.resolveCname('www.${DOMAIN}', (err, addrs) => {
    if (err) console.log('       www CNAME: UNRESOLVABLE');
    else console.log('       www CNAME: ' + addrs.join(', '));
  });
" 2>/dev/null || true
echo ""

# ── Final verdict ─────────────────────────────────────────────────────────
echo -e "${YELLOW}[5/5]${NC} Amendment instructions"
echo ""

if [[ "$VERIZ_ON_VERCEL" == "true" ]]; then
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✅ Nameserver transition is COMPLETE.${NC}"
  echo -e "${GREEN}  ${DOMAIN} is now served by Vercel DNS.${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
else
  echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  ✘  NAMESERVER TRANSITION REQUIRED${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  To complete the Vercel DNS delegation, change the nameservers"
  echo -e "  at your domain registrar (Host Africa) to:"
  echo ""
  echo -e "    ${CYAN}${VERCEL_NS1}${NC}"
  echo -e "    ${CYAN}${VERCEL_NS2}${NC}"
  echo ""
  echo -e "  Steps:"
  echo -e "    1. Log into https://www.hostafrica.co.za"
  echo -e "    2. Go to Domains → My Domains → ${DOMAIN}"
  echo -e "    3. Click 'Manage Nameservers'"
  echo -e "    4. Replace current entries:"
  echo -e "       ${RED}ns1.host-ww.net${NC}  →  ${GREEN}ns1.vercel-dns.com${NC}"
  echo -e "       ${RED}ns2.host-ww.net${NC}  →  ${GREEN}ns2.vercel-dns.com${NC}"
  echo -e "       (Remove ns3.host-ww.net, ns4.host-ww.net)"
  echo -e "    5. Save changes"
  echo ""
  echo -e "  Verify after propagation (may take 5-30 mins):"
  echo -e "    ${CYAN}node -e \"const dns=require('dns'); dns.resolveNs('${DOMAIN}',(e,a)=>console.log(a))\"${NC}"
  echo ""
  echo -e "  Then run this script again to confirm:"
  echo -e "    ${CYAN}bash scripts/transition-nameservers.sh${NC}"
  echo ""
  echo -e "  Expected result (NS records after transition):"
  echo -e "    ${GREEN}ns1.vercel-dns.com${NC}"
  echo -e "    ${GREEN}ns2.vercel-dns.com${NC}"
  echo ""
  echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
fi
