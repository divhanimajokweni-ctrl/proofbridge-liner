type Labels = Record<string, string | number | boolean>;

function counter(name: string) {
  return {
    add(value: number, labels: Labels = {}) {
      console.info('[metric.counter]', name, value, labels);
    },
  };
}

function gauge(name: string) {
  return {
    record(value: number, labels: Labels = {}) {
      console.info('[metric.gauge]', name, value, labels);
    },
  };
}

function histogram(name: string) {
  return {
    record(value: number, labels: Labels = {}) {
      console.info('[metric.histogram]', name, value, labels);
    },
  };
}

export const webhookCounter = counter('webhook.received');
export const webhookErrorCounter = counter('webhook.error');
export const proofCounter = counter('proof.created');
export const queueDepthGauge = gauge('queue.depth');
export const txLatencyHistogram = histogram('tx.latency');
