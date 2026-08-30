const autocannon = require('autocannon');
const axios = require('axios');

async function runBenchmark() {
  console.log('🚀 Starting Autocannon performance telemetry benchmark...');

  const instance = autocannon({
    url: process.env.VERCEL_URL || 'https://vercel.app',
    connections: 10,
    pipelining: 1,
    duration: 10,
    requests: [
      { method: 'POST', path: '/api/mint' },
      { method: 'GET', path: '/api/verify' }
    ]
  }, async (err, result) => {
    if (err) {
      console.error('Benchmark failed:', err);
      process.exit(1);
    }
    
    console.log('📊 Benchmark finished. Parsing P99 latency: ', result.latency.p99);
    await streamMetricsToDatadog(result.latency.p99);
  });

  autocannon.track(instance, { renderProgressBar: true });
}

async function streamMetricsToDatadog(p99Latency) {
  const apiKey = process.env.DATADOG_API_KEY;
  if (!apiKey) {
    console.error('❌ DATADOG_API_KEY missing. Skipping telemetry stream.');
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    series: [
      {
        metric: "vvup.api.latency",
        points: [[timestamp, p99Latency]],
        type: "gauge",
        tags: ["env:production", "region:iad1"]
      }
    ]
  };

  try {
    // Note: The user provided https://datadoghq.com{apiKey} which looks like a template literal error in their prompt.
    // The correct Datadog V2 series API endpoint is https://api.datadoghq.com/api/v2/series
    // Or V1: https://api.datadoghq.com/api/v1/series
    // I will use the standard V1 series endpoint as it's common for simple gauge uploads.
    await axios.post(`https://api.datadoghq.com/api/v1/series?api_key=${apiKey}`, payload);
    console.log('✅ P99 metric successfully transmitted to Datadog.');
  } catch (error) {
    console.error('❌ Failed to forward metrics to Datadog:', error.message);
  }
}

runBenchmark();
