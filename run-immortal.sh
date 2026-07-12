#!/bin/bash

# E2E Immortal Knowledge Engine
# Run: chmod +x run-immortal.sh && ./run-immortal.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}║     🧬 IMMORTAL KNOWLEDGE ENGINE — E2E PIPELINE          ║${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}║     Firecrawl → VVU Colony → SQLite → Memory → GitHub    ║${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for required env vars
if [ -z "$FIRECRAWL_API_KEY" ]; then
    echo -e "${RED}❌ FIRECRAWL_API_KEY not set${NC}"
    echo "   export FIRECRAWL_API_KEY='your-key-here'"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set — PR creation will be skipped${NC}"
fi

echo -e "${GREEN}✅ Environment ready${NC}"
echo ""

# Check if VVU MCP is running
if ! pgrep -f "vvu-mcp-server" > /dev/null; then
    echo -e "${BLUE}🚀 Starting VVU MCP Server...${NC}"
    node vvu-mcp-server/index.js &
    VVU_MCP_PID=$!
    sleep 2
    echo -e "${GREEN}   VVU MCP Server started (PID: $VVU_MCP_PID)${NC}"
else
    echo -e "${GREEN}✅ VVU MCP Server already running${NC}"
fi

# Start SQLite database
if [ ! -f ".vvu/knowledge.db" ]; then
    echo -e "${BLUE}📁 Creating SQLite database...${NC}"
    mkdir -p .vvu
    if command -v sqlite3 &> /dev/null; then
        sqlite3 .vvu/knowledge.db "CREATE TABLE IF NOT EXISTS immortal_knowledge (
            id TEXT PRIMARY KEY,
            claim TEXT,
            source TEXT,
            timestamp TEXT,
            trust_score REAL,
            verification_status TEXT,
            canopy_size INTEGER
        );"
        echo -e "${GREEN}   Database created${NC}"
    else
        echo -e "${YELLOW}⚠️  sqlite3 not found — database will be created by MCP server${NC}"
        touch .vvu/knowledge.db
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   🚀 READY — Enter a URL to immortalize${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Take input
read -p "URL to immortalize: " URL

if [ -z "$URL" ]; then
    echo -e "${RED}❌ No URL provided${NC}"
    exit 1
fi

read -p "Topic (optional): " TOPIC

# Build command
COMMAND="kilocode --config .kilocode/config.e2e.json --agent immortal-engine --workflow immortalize-e2e --param url='$URL'"

if [ -n "$TOPIC" ]; then
    COMMAND="$COMMAND --param topic='$TOPIC'"
fi

echo ""
echo -e "${BLUE}⚡ Running: $COMMAND${NC}"
echo ""

# Execute
eval $COMMAND

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ IMMORTALIZATION COMPLETE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📍 Open colony-model.html to see the canopy"
echo "📍 Check your GitHub for the PR"
echo "📍 SQLite database: .vvu/knowledge.db"
echo "📍 Memory MCP has stored the context for next time"
