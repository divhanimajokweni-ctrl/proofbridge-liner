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
  // @ts-ignore
  console.log(`Prompt tokens:     ${usage.promptTokens ?? usage?.inputTokens ?? 0}`);
  // @ts-ignore
  console.log(`Completion tokens: ${usage.completionTokens ?? usage?.outputTokens ?? 0}`);
  // @ts-ignore
  console.log(`Total tokens:      ${usage.totalTokens ?? (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)}`);
}

main().catch(console.error);
