/**
 * HmacSecurityGuard.js
 * Fall-closed HMAC inter-process communication security guard.
 *
 * Enforces cryptographically signed payloads across all internal service
 * boundaries using SHA-256 HMAC. Fails closed on any verification error,
 * missing signature, or runtime exception — preventing silent data corruption
 * or unauthorized state injection.
 *
 * Pattern: signPayload() on write, verifyRequest() on read.
 * Both paths are constant-time to prevent timing side-channel attacks.
 */
const crypto = require('crypto');

const HmacSecurityGuard = {
  /**
   * Secret token used for HMAC signing and verification.
   * Falls back to a hardcoded hash if INTERCOM_TOKEN env var is unset.
   * In production, INTERCOM_TOKEN MUST be set via secure environment injection.
   */
  SECRET_TOKEN: process.env.INTERCOM_TOKEN || 'fallback_secure_intercom_token_hash_2026',

  /**
   * Generates a SHA-256 HMAC signature for a payload.
   *
   * @param {string|Object} payload - The data to sign. Objects are JSON-serialized.
   * @returns {string} Hex-encoded HMAC digest
   */
  signPayload: function(payload) {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.SECRET_TOKEN)
      .update(serialized, 'utf-8')
      .digest('hex');
  },

  /**
   * Verifies an incoming payload against its expected signature.
   * FALL-CLOSED GUARD: Returns false for any failure mode — missing params,
   * mismatched signature, or runtime error.
   *
   * @param {string|Object} payload          - The received data
   * @param {string}        incomingSignature - The claimed HMAC signature
   * @returns {boolean} True only if signature is valid and payload is authentic
   */
  verifyRequest: function(payload, incomingSignature) {
    // Fall-closed: reject immediately if either parameter is absent
    if (!incomingSignature || !payload) {
      console.error('HmacSecurityGuard: FALL-CLOSED — missing signature or payload');
      return false;
    }

    try {
      const computedSignature = this.signPayload(payload);

      // Constant-time comparison prevents timing side-channel attacks
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'utf-8'),
        Buffer.from(incomingSignature, 'utf-8')
      );

      if (!isMatch) {
        console.error('HmacSecurityGuard: FALL-CLOSED — signature mismatch');
        return false;
      }

      return true;
    } catch (err) {
      // Any runtime exception results in closed state
      console.error('HmacSecurityGuard: FALL-CLOSED — runtime error', err.message);
      return false;
    }
  },
};

module.exports = HmacSecurityGuard;
