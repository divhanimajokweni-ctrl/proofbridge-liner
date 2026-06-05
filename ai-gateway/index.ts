import 'dotenv/config';
import { streamText } from 'ai';

async function main() {
  const result = streamText({
    model: 'openai/gpt-4o-mini',
    prompt: 'Why is the sky blue?',
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  const usage = await result.usage;
  console.log('\n\n--- Token Usage ---');
  console.log(`Prompt tokens:     ${usage.promptTokens}`);
  console.log(`Completion tokens: ${usage.completionTokens}`);
  console.log(`Total tokens:      ${usage.totalTokens}`);
}

main().catch(console.error);
