
#!/usr/bin/env bash
# ==============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-LAUNCH-STACK-v1.0 (LOCAL ENGINE & PIPELINE BOOTSTRAPPER)
# DESCRIPTION: UNILATERAL B2B INFRASTRUCTURE LAUNCHER
# ==============================================================================

export NC='\033[0m'
export GREEN='\033[38;5;46m'
export SLATE='\033[38;5;244m'
export CYAN='\033[38;5;45m'
export RED='\033[38;5;196m'
export YELLOW='\033[38;5;220m'

clear
echo -e "${CYAN}======================================================================"
echo -e "      __     __     __  __        _____   _____    _____ "
echo -e "      \\ \\   / /     \\ \\/ /       |  __ \\ |  __ \\  / ____|"
echo -e "       \\ \\_/ /_   _  \\  / _   _  | |__) || |__) || |     "
echo -e "        \\   /| | | |  / \\| | | | |  ___/ |  _  / | |     "
echo -e "         | | | |_| | / /\\ \\ |_| | | |     | | \\ \\ | |____ "
echo -e "         |_|  \\__,_|/_/  \\_\\\\__,_| |_|     |_|  \\_\\ \\_____|"
echo -e "                                                        "
echo -e "       VENTURE VISION UBUNTU ────────────────────────── B2B ENGINE"
echo -e "======================================================================"${NC}
echo -e "${SLATE}Current System Time: $(date -uIs)${NC}"
echo -e "${SLATE}Operational Mode: UNILATERAL B2B INDUSTRIAL ASSET PROTECTION${NC}"
echo -e "${CYAN}----------------------------------------------------------------------${NC}"

ENV_FILE=".env"
LOG_DIR="./logs"
PID_DIR="./pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}[✓] Found active environment file: $ENV_FILE${NC}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo -e "${YELLOW}[!] Environment configuration file ($ENV_FILE) not found.${NC}"
    echo -e "${SLATE}Creating a default template. Please populate your API credentials.${NC}"
    cat << 'EOF' > "$ENV_FILE"
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=vvu_pis_db
DB_USER=vvu_operator
DB_PASSWORD=vvu_secure_password_2026
HMAC_SECRET_KEY=vvu_secure_element_hardware_signing_key_2026_08
RESEND_API_KEY=re_your_api_key_here
APOLLO_API_KEY=ap_your_api_key_here
HUBSPOT_ACCESS_TOKEN=pat-na-your-token-here
X_BEARER_TOKEN=your_bearer_token_here
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
WEBHOOK_PORT=8080
POLLING_INTERVAL_SECONDS=3600
EOF
    echo -e "${GREEN}[✓] Created template $ENV_FILE.${NC}"
    echo -e "${RED}[!] ACTION REQUIRED: Please edit $ENV_FILE and run this script again.${NC}"
    exit 1
fi

echo -e "\n${CYAN}[1/4] Running prerequisite software dependencies checks...${NC}"
DEPENDENCIES=("psql" "python3" "pip3")
for cmd in "${DEPENDENCIES[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${RED}[✗] Missing dependency: $cmd. Please install to continue.${NC}"
        exit 1
    else
        echo -e "${GREEN}[✓] Dependency located: $cmd${NC}"
    fi
done

echo -e "${SLATE}Verifying required Python libraries...${NC}"
python3 -c "import openpyxl, psycopg2, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[!] Some specialized libraries are missing. Running pip installation...${NC}"
    pip3 install openpyxl psycopg2-binary requests pyyaml
    if [ $? -ne 0 ]; then
        echo -e "${RED}[✗] Library installation failed.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}[✓] All Python libraries verified.${NC}"

echo -e "\n${CYAN}[2/4] Setting up localized PostgreSQL PIS schema...${NC}"
SQL_FILE="vvu-pis-db-schema.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}[✗] SQL Schema file ($SQL_FILE) is missing.${NC}"
    exit 1
fi

export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[!] Database '$DB_NAME' does not exist. Attempting creation...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    if [ $? -ne 0 ]; then
        echo -e "${RED}[✗] Failed to create database.${NC}"
        exit 1
    fi
fi

echo -e "${SLATE}Deploying tables, views, checks, and constants to $DB_NAME...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" > "$LOG_DIR/db_setup.log" 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}[✗] SQL Schema deployment failed. Check logs at: $LOG_DIR/db_setup.log${NC}"
    exit 1
else
    echo -e "${GREEN}[✓] Database tables active.${NC}"
fi

echo -e "\n${CYAN}[3/4] Launching the secure Resend Email Agent...${NC}"
EMAIL_SCRIPT="vvu-email-agent.py"
if [ ! -f "$EMAIL_SCRIPT" ]; then
    echo -e "${RED}[✗] Email agent script ($EMAIL_SCRIPT) is missing.${NC}"
    exit 1
fi

nohup python3 "$EMAIL_SCRIPT" > "$LOG_DIR/email_agent.log" 2>&1 &
EMAIL_PID=$!
echo "$EMAIL_PID" > "$PID_DIR/email_agent.pid"

sleep 1.5
if ps -p "$EMAIL_PID" > /dev/null; then
    echo -e "${GREEN}[✓] Resend Agent active in background (PID: $EMAIL_PID).${NC}"
else
    echo -e "${RED}[✗] Email Agent failed to start. Review logs at: $LOG_DIR/email_agent.log${NC}"
    exit 1
fi

echo -e "\n${CYAN}[4/4] Activating Apollo / HubSpot / LinkedIn / X B2B Growth Integrator...${NC}"
GROWTH_SCRIPT="vvu-growth-integrator.py"
if [ ! -f "$GROWTH_SCRIPT" ]; then
    echo -e "${RED}[✗] Growth script ($GROWTH_SCRIPT) is missing.${NC}"
    kill "$EMAIL_PID" && rm -f "$PID_DIR/email_agent.pid"
    exit 1
fi

nohup python3 "$GROWTH_SCRIPT" > "$LOG_DIR/growth_integrator.log" 2>&1 &
GROWTH_PID=$!
echo "$GROWTH_PID" > "$PID_DIR/growth_integrator.pid"

sleep 1.5
if ps -p "$GROWTH_PID" > /dev/null; then
    echo -e "${GREEN}[✓] B2B Growth loop initialized in background (PID: $GROWTH_PID).${NC}"
else
    echo -e "${RED}[✗] Growth Integrator failed to start.${NC}"
    kill "$EMAIL_PID" && rm -f "$PID_DIR/email_agent.pid"
    exit 1
fi

echo -e "${CYAN}======================================================================"
echo -e "${GREEN}SUCCESS: VVU INDUSTRIAL B2B ACQUISITION STACK ACTIVE!"
echo -e "======================================================================"${NC}
echo -e "  - Local PostgreSQL DB:  ${CYAN}$DB_HOST:$DB_PORT/$DB_NAME${NC}"
echo -e "  - Resend Email Agent:   ${CYAN}Listening on Webhook Port $WEBHOOK_PORT${NC}"
echo -e "  - B2B API Integrator:   ${CYAN}Active polling (Apollo, HubSpot, LinkedIn, X)${NC}"
echo -e "----------------------------------------------------------------------"
echo -e "To stop all services, run: ${YELLOW}kill \$(cat $PID_DIR/*.pid)${NC}"
echo -e "To monitor live logs, run: ${YELLOW}tail -f $LOG_DIR/*.log${NC}"
echo -e "${CYAN}======================================================================"${NC}

---

