import { execSync } from 'child_process'

export async function injectFailure(type: string) {
  switch (type) {
    case 'worker_crash':
      execSync("kubectl delete pod -l app=proofbridge-worker")
      break

    case 'redis_latency':
      execSync(`
        kubectl exec redis-cluster-0 -- 
        tc qdisc add dev eth0 root netem delay 200ms
      `)
      break

    case 'db_connection_drop':
      execSync(`
        kubectl delete pod -l app=postgres
      `)
      break

    case 'aggregation_interrupt':
      process.env.CHAOS_MODE = 'INTERRUPT_AGG'
      break
  }
}
