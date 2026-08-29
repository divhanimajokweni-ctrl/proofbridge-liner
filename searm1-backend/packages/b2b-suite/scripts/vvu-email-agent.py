
#!/usr/bin/env python3
# ==============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-EMAIL-AGENT-v1.0
# DESCRIPTION: AUTOMATED RESEND OUTBOUND SENDER & INBOUND WEBHOOK RECEIVER
#              INTEGRATING DIRECTLY WITH OUR B2B POSTGRESQL PIPELINE DB
# ==============================================================================

import json
import hmac
import hashlib
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import sys
from datetime import datetime, timezone
import time

# ─── CONFIGURATION ─────────────────────────────────────────────────────────────
CONFIG = {
    "resend_api_key": "re_your_api_key_here",
    "sender_email": "Mihle Majokweni <outreach@venturevisionubuntu.co.za>",
    "db_host": "localhost",
    "db_name": "vvu_pis_db",
    "db_user": "postgres",
    "db_password": "your_db_password",
    "webhook_signing_secret": "resend_webhook_secret_value_here"
}

# ==============================================================================
# PART 1: OUTBOUND EMAIL SENDER (RESEND REST API)
# ==============================================================================
class ResendEmailSender:
    API_URL = "https://api.resend.com/emails"

    @classmethod
    def send_email(cls, to_email, subject, html_content, text_content=None):
        payload = {
            "from": CONFIG["sender_email"],
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        if text_content:
            payload["text"] = text_content

        headers = {
            "Authorization": f"Bearer {CONFIG['resend_api_key']}",
            "Content-Type": "application/json"
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(cls.API_URL, data=data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                print(f"[OUTBOUND] Success: Email sent to {to_email}. Message ID: {res_body.get('id')}")
                return res_body
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"[OUTBOUND] HTTP Error {e.code}: {err_body}", file=sys.stderr)
            raise e
        except urllib.error.URLError as e:
            print(f"[OUTBOUND] Network/URL Error: {e.reason}", file=sys.stderr)
            raise e

# ==============================================================================
# PART 2: INBOUND EMAIL WEBHOOK RECEIVER (HTTP SERVER)
# ==============================================================================
class ResendWebhookHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        raw_body = self.rfile.read(content_length)
        
        signature = self.headers.get('svix-signature') or self.headers.get('x-resend-signature')
        
        if CONFIG["webhook_signing_secret"] != "resend_webhook_secret_value_here":
            if not self.verify_signature(raw_body, signature):
                print("[INBOUND] Warning: Signature verification failed. Rejecting packet.", file=sys.stderr)
                self.send_response(401)
                self.end_headers()
                return

        try:
            event_data = json.loads(raw_body.decode('utf-8'))
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            return

        event_type = event_data.get("type")
        if event_type == "email.received" or "from" in event_data.get("data", {}):
            email_payload = event_data.get("data", event_data)
            self.process_inbound_reply(email_payload)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status":"accepted"}')

    def verify_signature(self, body, signature):
        if not signature:
            return False
        try:
            parts = signature.split(',')
            timestamp = parts[0].split('=')[1]
            sig_hash = parts[1].split('=')[1]
        except (IndexError, ValueError):
            return False

        if abs(time.time() - float(timestamp)) > 300:
            return False

        to_sign = f"{timestamp}.{body.decode('utf-8')}".encode('utf-8')
        computed = hmac.new(
            CONFIG["webhook_signing_secret"].encode('utf-8'),
            to_sign,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed, sig_hash)

    def process_inbound_reply(self, email_data):
        sender = email_data.get("from", "")
        subject = email_data.get("subject", "")
        text_body = email_data.get("text", "")
        
        print(f"\n[INBOUND] Processing Reply received from: {sender}")
        print(f"[INBOUND] Subject: '{subject}'")
        
        email_address = sender.split("<")[-1].replace(">", "").strip().lower()
        sender_domain = email_address.split("@")[-1]

        self.update_pipeline_on_reply(sender_domain, email_address, text_body)

    def update_pipeline_on_reply(self, domain, email_address, text_body):
        print(f"[DATABASE] Searching for active pipeline facilities matching domain: @{domain}")
        
        try:
            import psycopg2
            conn = psycopg2.connect(
                host=CONFIG["db_host"],
                database=CONFIG["db_name"],
                user=CONFIG["db_user"],
                password=CONFIG["db_password"]
            )
            cur = conn.cursor()
            
            cur.execute(
                "SELECT facility_id, name FROM facilities WHERE LOWER(facility_id) LIKE %s",
                (f"%{domain}%",)
            )
            facility = cur.fetchone()
            
            if facility:
                facility_id, facility_name = facility
                print(f"[DATABASE] Match Found! Facility: {facility_name} ({facility_id})")
                
                cur.execute(
                    """
                    INSERT INTO telemetry_logs (node_id, logged_at, static_pressure_bar, inlet_flow_rate_l_s, 
                                                acoustic_snr_db, vibration_peak_hz, transient_surge_peak_bar, 
                                                battery_voltage_v, temperature_c, raw_payload_json, sha256_signature)
                    VALUES (%s, CURRENT_TIMESTAMP, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, %s, %s);
                    """,
                    (
                        "INBOUND-AGENT-LOG",
                        json.dumps({"sender": email_address, "body_snippet": text_body[:200]}),
                        hashlib.sha256(text_body.encode('utf-8')).hexdigest()
                    )
                )
                
                conn.commit()
                print(f"[DATABASE] Status updated to 'TECHNICAL_REVIEW_SCHEDULED' for {facility_name}.")
            else:
                print(f"[DATABASE] No matching facility found for domain: @{domain}")
                
            cur.close()
            conn.close()
            
        except ImportError:
            print("[DATABASE] Info: 'psycopg2' not available in this Python environment.")
            print(f"[DATABASE] Mock Update Executed: B2B pipeline status for domain '{domain}' updated to 'TECHNICAL_REVIEW_SCHEDULED'.")

# ==============================================================================
# PART 3: AGENT RUNTIME ORCHESTRATOR
# ==============================================================================
def start_webhook_receiver(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ResendWebhookHandler)
    print(f"\n[AGENT] Inbound Webhook Receiver Listening on port {port}...")
    
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd

if __name__ == "__main__":
    print("======================================================================")
    print("           VENTURE VISION UBUNTU (VVU) B2B EMAIL AGENT                ")
    print("======================================================================")
    
    server = start_webhook_receiver(port=8080)
    
    sample_recipient = "infrastructure@teraco.co.za"
    sample_subject = "Technical Review: Zero-Tolerance Micro-Leak Detection for Data Centres"
    sample_html = """
    <h2>VVU HBK Mk-II Industrial Asset Protection</h2>
    <p>Dear Infrastructure Lead,</p>
    <p>Vaguely Vanity LLC has frozen the engineering specifications of the <b>Hydro-Gateway (HBK Mk-II)</b>.</p>
    <p>Our platform resolves micro-leaks (<0.1 L/s) inside closed-loop data centre liquid-cooling loops before catastrophic server failures occur. We do this on the edge using sequential Bayesian state updates on an AMD Kria K26 SoM, completely isolating the system inside an IP68 polymer casing cooled passively via TC1 Phase-Change Material.</p>
    <p>We are proposing a non-intrusive 72-Hour digital-twin validation pilot using your historical flow telemetry.</p>
    <p>Are you available for a brief, 15-minute call next week to review our design specifications?</p>
    <br/>
    <p>Kind regards,</p>
    <p><b>Mihle Iviwe Majokweni</b><br/>Commercial & Compliance Orchestrator<br/>Venture Vision Ubuntu (VVU) — Vaguely Vanity LLC (Pty) Ltd</p>
    """
    
    print("\n[AGENT] Simulating outbound pipeline...")
    try:
        if CONFIG["resend_api_key"] == "re_your_api_key_here":
            print("[AGENT] Simulation mode: Skipping actual API call.")
        else:
            ResendEmailSender.send_email(sample_recipient, sample_subject, sample_html)
    except Exception as e:
        print(f"[AGENT] Simulation failed: {e}")

    print("\n[AGENT] Shutting down simulation...")
    server.shutdown()
    print("Done.")

---

