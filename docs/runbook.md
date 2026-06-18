# ProofBridge Recovery Runbook

## Oracle Key Compromise

1. Freeze signer:
   - Call `pauseSubmissions()` on `CircuitBreaker`.
   - Alert all pool facilitators.
2. Rotate key:
   - Generate a new oracle private key.
   - Update `ORACLE_PRIVATE_KEY` in the worker runtime only.
   - Call `setOracle()` with the new signer address.
   - Redeploy or restart workers.
3. Drain and verify:
   - Pause worker polling.
   - Drain existing queue.
   - Verify pending proofs against the event ledger and on-chain state.
4. Resume:
   - Call `unpauseSubmissions()` on `CircuitBreaker`.
   - Resume worker polling.

## Redis Failure

1. Restore the latest Redis snapshot.
2. Re-queue all `RECEIVED` and recoverable `FAILED` events from the database.
3. Restart BullMQ workers and monitor queue depth.

## Polygon Outage

1. Continue accepting webhooks into the event ledger and queue.
2. Pause worker submissions until RPC health returns.
3. Resume workers, process backlog, and monitor gas prices plus transaction latency.
