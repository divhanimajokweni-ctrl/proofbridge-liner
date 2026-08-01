// safeliner.go — SafeLiner CircuitBreaker Proxy
//
// A zero-latency sidecar proxy that implements Deep Packet Inspection (DPI)
// on the LSP (Language Server Protocol) byte stream.  It sits between socat
// and the Lean 4 compiler process, intercepting every JSON-RPC message to
// enforce the CircuitBreaker ruleset.
//
// Blocked patterns (SanitisationBlocklist):
//   - #eval IO.*           — System-level I/O injection
//   - System\.IO           — System module access
//   - unsafe def           — Unsafe definition bypass
//   - native_decide        — Compiler override
//   - import Lake          — Build-system access (privilege escalation)
//
// Architecture:
//   socat TCP-LISTEN:8888 → safeliner (this binary) → lean --server
//                                                         │
//                                                   (stdout passes through)
//
// Build:
//   go build -o safeliner safeliner.go
//
// Usage:
//   socat TCP-LISTEN:8888,fork,reuseaddr EXEC:"./safeliner",nofork

package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ── Configuration ────────────────────────────────────────────────────────────

// SanitisationBlocklist defines the regex patterns that trigger a BLOCK verdict.
// Every inbound LSP message is scanned against these rules before forwarding
// to the Lean 4 compiler.
var SanitisationBlocklist = []*regexp.Regexp{
	regexp.MustCompile(`#eval\s+IO`),        // Block IO execution (#eval IO.println)
	regexp.MustCompile(`System\.IO`),         // Block System IO module access
	regexp.MustCompile(`unsafe\s+def`),       // Block unsafe definition bypass
	regexp.MustCompile(`native_decide`),      // Block compiler-override commands
	regexp.MustCompile(`import\s+Lake`),      // Block Lake build-system access
	regexp.MustCompile(`#eval\s+System\.IO`), // Block eval of System.IO
}

// AllowedMethods defines LSP methods that MAY carry executable Lean code.
// Only these methods are subject to DPI scanning; all other messages
// (e.g. initialize, shutdown) pass through untouched.
var AllowedMethods = []string{
	"textDocument/didOpen",
	"textDocument/didChange",
	"textDocument/willSave",
	"textDocument/didSave",
}

// ── Audit Logging ────────────────────────────────────────────────────────────

type AuditEntry struct {
	Timestamp  string `json:"timestamp"`
	Method     string `json:"method"`
	Verdict    string `json:"verdict"` // ALLOW | BLOCK
	Pattern    string `json:"pattern,omitempty"`
	URI        string `json:"uri,omitempty"`
	PacketSize int    `json:"packet_size"`
}

func audit(entry AuditEntry) {
	entry.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
	line, _ := json.Marshal(entry)
	log.Println(string(line))
}

// ── DPI Engine ───────────────────────────────────────────────────────────────

// isMalicious inspects the decoded LSP body against the blocklist.
// Returns the matched pattern (or "" if none).  The second return value is
// true if the packet must be blocked.
func isMalicious(payload []byte) (matchedPattern string, blocked bool) {
	bodyStr := string(payload)

	// Fast path: skip if not a textDocument method
	if !strings.Contains(bodyStr, "textDocument") {
		return "", false
	}

	// Extract method name from JSON body
	var frame struct {
		Method string `json:"method"`
	}
	if err := json.Unmarshal(payload, &frame); err != nil {
		// Not valid JSON-RPC — could be fuzzing; let Lean decide
		return "", false
	}

	// Only scan methods that can carry executable code
	methodAllowed := false
	for _, m := range AllowedMethods {
		if frame.Method == m {
			methodAllowed = true
			break
		}
	}
	if !methodAllowed {
		return "", false
	}

	// Scan against blocklist
	for _, rule := range SanitisationBlocklist {
		if rule.MatchString(bodyStr) {
			return rule.String(), true
		}
	}

	return "", false
}

// ── LSP Framing (Content-Length Parser) ─────────────────────────────────────

// scanLSPMessages is a bufio.SplitFunc that isolates individual LSP messages
// from the raw TCP byte stream.  LSP framing:
//
//	Content-Length: <N>\r\n\r\n<JSON body of N bytes>
func scanLSPMessages(data []byte, atEOF bool) (advance int, token []byte, err error) {
	const sep = "\r\n\r\n"

	// Locate the end of the header section
	headerEnd := strings.Index(string(data), sep)
	if headerEnd == -1 {
		if atEOF && len(data) > 0 {
			return 0, nil, fmt.Errorf("incomplete LSP header (no separator found)")
		}
		return 0, nil, nil // need more data
	}

	// Parse Content-Length value
	headerPart := string(data[:headerEnd])
	re := regexp.MustCompile(`Content-Length:\s*(\d+)`)
	matches := re.FindStringSubmatch(headerPart)
	if len(matches) < 2 {
		// Malformed header — consume the message as-is so the connection
		// doesn't stall; the proxy will still forward it and Lean will
		// return an error.
		return len(data), data, nil
	}

	contentLength, err := strconv.Atoi(matches[1])
	if err != nil || contentLength < 0 {
		// Invalid content-length; consume everything available
		return len(data), data, nil
	}

	totalLength := headerEnd + len(sep) + contentLength
	if len(data) < totalLength {
		return 0, nil, nil // need more data
	}

	return totalLength, data[:totalLength], nil
}

// ── Proxy ────────────────────────────────────────────────────────────────────

func main() {
	log.SetFlags(0)
	log.SetOutput(os.Stderr)
	log.Println("[SafeLiner] ═══════════════════════════════════════════")
	log.Println("[SafeLiner]  Shield ACTIVE. Starting Lean 4 LSP...")
	log.Println("[SafeLiner] ═══════════════════════════════════════════")

	// 1. Spawn the protected Lean 4 compiler process
	cmd := exec.Command("lean", "--server")
	leanStdin, err := cmd.StdinPipe()
	if err != nil {
		log.Fatalf("[SafeLiner] FAILED to attach to Lean stdin: %v", err)
	}
	leanStdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Fatalf("[SafeLiner] FAILED to attach to Lean stdout: %v", err)
	}
	leanStderr, err := cmd.StderrPipe()
	if err != nil {
		log.Fatalf("[SafeLiner] FAILED to attach to Lean stderr: %v", err)
	}

	if err := cmd.Start(); err != nil {
		log.Fatalf("[SafeLiner] FAILED to start Lean: %v", err)
	}
	log.Println("[SafeLiner] Lean 4 process started (PID", cmd.Process.Pid, ")")

	var wg sync.WaitGroup
	wg.Add(3)

	// 2. UPSTREAM: Lean stdout → client (pass-through, trusted compiler output)
	go func() {
		defer wg.Done()
		written, err := io.Copy(os.Stdout, leanStdout)
		if err != nil {
			log.Printf("[SafeLiner] [stdout copy error] %v (after %d bytes)", err, written)
		}
		log.Printf("[SafeLiner] [stdout] closed: %d bytes forwarded", written)
	}()

	// 3. Lean stderr → our stderr (forwards compiler diagnostic messages)
	go func() {
		defer wg.Done()
		written, err := io.Copy(os.Stderr, leanStderr)
		if err != nil {
			log.Printf("[SafeLiner] [stderr copy error] %v (after %d bytes)", err, written)
		}
		log.Printf("[SafeLiner] [stderr] closed: %d bytes forwarded", written)
	}()

	// 4. DOWNSTREAM: Client → Lean (The Filter Gate)
	//
	//    Every inbound message is:
	//      1. Parsed from the raw TCP stream (LSP framing)
	//      2. Inspected via DPI against SanitisationBlocklist
	//      3. Logged to the audit trail
	//      4. Either forwarded to Lean or silently dropped
	go func() {
		defer wg.Done()

		scanner := bufio.NewScanner(os.Stdin)
		scanner.Split(scanLSPMessages)

		for scanner.Scan() {
			message := scanner.Bytes()
			msgCopy := make([]byte, len(message))
			copy(msgCopy, message)

			// Inspect the payload
			pattern, blocked := isMalicious(msgCopy)

			// Build audit entry
			entry := AuditEntry{
				PacketSize: len(msgCopy),
				Verdict:    "ALLOW",
			}

			// Try to extract method / URI from body for richer audit
			bodyStart := strings.Index(string(msgCopy), "\r\n\r\n")
			if bodyStart != -1 {
				bodyPart := msgCopy[bodyStart+4:]
				var frame struct {
					Method string `json:"method"`
					Params struct {
						TextDocument struct {
							URI string `json:"uri"`
						} `json:"textDocument"`
					} `json:"params"`
				}
				if err := json.Unmarshal(bodyPart, &frame); err == nil {
					entry.Method = frame.Method
					entry.URI = frame.Params.TextDocument.URI
				}
			}

			if blocked {
				entry.Verdict = "BLOCK"
				entry.Pattern = pattern
				audit(entry)

				log.Printf("[SafeLiner] 🛑  THREAT DETECTED — pattern=%q method=%s uri=%s",
					pattern, entry.Method, entry.URI)
				continue // DROP the packet — client sees no-op / timeout
			}

			audit(entry)

			// Forward the entire framed message to the Lean compiler
			if _, err := leanStdin.Write(msgCopy); err != nil {
				log.Printf("[SafeLiner] [forward error] %v", err)
				return
			}
		}

		if err := scanner.Err(); err != nil {
			log.Printf("[SafeLiner] [scanner error] %v", err)
		}

		// Close stdin to signal Lean that input stream is finished
		leanStdin.Close()
	}()

	// 5. Wait for the Lean process to terminate
	if err := cmd.Wait(); err != nil {
		log.Printf("[SafeLiner] Lean process exited: %v", err)
	} else {
		log.Println("[SafeLiner] Lean process exited cleanly.")
	}

	// 6. Wait for all I/O goroutines to drain
	wg.Wait()
	log.Println("[SafeLiner] SafeLiner proxy shutdown complete.")
}
