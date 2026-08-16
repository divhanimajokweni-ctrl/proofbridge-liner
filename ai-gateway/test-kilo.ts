import "dotenv/config";
import { aiGateway } from './router.js';

async function testKilo() {
  // Register a temporary intent using Kilo for testing
  aiGateway.registerIntent('chat', {
    primaryProvider: 'kilo',
    fallbackProvider: 'claude',
    model: 'qwen/qwen3-coder-next',
    maxTokens: 100,
    temperature: 0.3,
  });

  console.log('Testing Kilo AI Gateway...');
  try {
    const response = await aiGateway.executeIntent('chat', 'Hello, Kilo!');
    console.log('Response:', response);
  } catch (error) {
    console.error('Kilo test failed:', error);
  }
}

testKilo();
