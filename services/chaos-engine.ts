import { injectFailure } from './injector'

const CHAOS_INTERVAL = 5 * 60 * 1000 // every 5 minutes

const FAILURE_MODES = [
  'worker_crash',
  'redis_latency',
  'db_connection_drop',
  'aggregation_interrupt'
]

export function startChaosEngine() {
  setInterval(async () => {
    const mode = FAILURE_MODES[
      Math.floor(Math.random() * FAILURE_MODES.length)
    ]

    console.log(`[CHAOS] Injecting: ${mode}`)

    await injectFailure(mode)
  }, CHAOS_INTERVAL)
}
