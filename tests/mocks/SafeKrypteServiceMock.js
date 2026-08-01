/**
 * SafeKrypteServiceMock.js
 * Lightweight HTTP mock server for SafeKrypte key escrow endpoints.
 *
 * When behavioral coverage (scripts/behavioral-coverage.ts) tests the
 * SafeKrypte flow, it POSTs to /commons/v1/keygen and GETs /commons/v1/stats.
 * This mock responds with valid-shaped JSON so the test suite passes.
 *
 * Usage:
 *   const mock = require('./SafeKrypteServiceMock');
 *   await mock.start();   // listens on port 5096
 *   // ... run tests ...
 *   mock.stop();          // clean shutdown
 */
const http = require('http');

const SafeKrypteServiceMock = {
  server: null,
  PORT: 5096,  // Matches SAFE_KRIPTE_URL default in behavioral-coverage.ts

  /**
   * Starts the mock HTTP server.
   * @param {number} [port] - Optional port override
   * @returns {Promise<void>}
   */
  start: function(port) {
    const listenPort = port || this.PORT;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // CORS headers for test compatibility
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        // ── POST /commons/v1/keygen ─────────────────────────────────
        if (req.method === 'POST' && req.url === '/commons/v1/keygen') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            console.log(`[SafeKrypteMock] POST /commons/v1/keygen <- ${body || '(empty)'}`);
            res.writeHead(200);
            res.end(JSON.stringify({
              status: 'ok',
              key_id: 'mock-key-' + Date.now(),
              algorithm: 'ed25519',
              threshold: 3,
              escrow_state: 'sealed',
              message: 'Key generated and escrowed (mock)',
            }));
          });
          return;
        }

        // ── GET /commons/v1/stats ────────────────────────────────────
        if (req.method === 'GET' && req.url === '/commons/v1/stats') {
          console.log('[SafeKrypteMock] GET /commons/v1/stats');
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'ok',
            total_keys: 42,
            active_keys: 38,
            threshold: 3,
            escrow_integrity: 'verified',
            service: 'SafeKrypte_Mock',
            code: 200,
          }));
          return;
        }

        // ── Catch-all ────────────────────────────────────────────────
        console.log(`[SafeKrypteMock] ${req.method} ${req.url} -> 404`);
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'not_found', path: req.url }));
      });

      this.server.listen(listenPort, () => {
        console.log(`SafeKrypte Mock Service online at http://localhost:${listenPort}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  },

  /**
   * Stops the mock HTTP server.
   */
  stop: function() {
    if (this.server) {
      this.server.close();
      console.log('SafeKrypte Mock Service offline.');
    }
  },
};

module.exports = SafeKrypteServiceMock;
