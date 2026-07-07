/**
 * AI Capability Layer — Intent Router, Capability Registry & Model Router
 *
 * Replaces direct third-party API calls (Mistral/Claude/Fireworks) with
 * a central routing layer that maps task intents to optimal providers
 * with automatic fallback.
 */

import { MistralClient } from '@mistralai/mistralai';
import { Anthropic } from '@anthropic-ai/sdk';

// ─── Intent Registry ────────────────────────────────────────────────

export type TaskIntent = 'routing' | 'extraction' | 'verification' | 'chat' | 'analysis';

interface RouteConfig {
  primaryProvider: 'mistral' | 'claude' | 'fireworks';
  fallbackProvider: 'mistral' | 'claude' | 'fireworks';
  model: string;
  maxTokens: number;
  temperature: number;
}

const CAPABILITY_REGISTRY: Map<TaskIntent, RouteConfig> = new Map([
  [
    'routing',
    {
      primaryProvider: 'mistral',
      fallbackProvider: 'claude',
      model: 'mistral-large-latest',
      maxTokens: 1024,
      temperature: 0.1,
    },
  ],
  [
    'extraction',
    {
      primaryProvider: 'claude',
      fallbackProvider: 'mistral',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 2048,
      temperature: 0.05,
    },
  ],
  [
    'verification',
    {
      primaryProvider: 'fireworks',
      fallbackProvider: 'claude',
      model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      maxTokens: 1024,
      temperature: 0.0,
    },
  ],
  [
    'chat',
    {
      primaryProvider: 'mistral',
      fallbackProvider: 'claude',
      model: 'mistral-large-latest',
      maxTokens: 2048,
      temperature: 0.3,
    },
  ],
  [
    'analysis',
    {
      primaryProvider: 'claude',
      fallbackProvider: 'fireworks',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.2,
    },
  ],
]);

// ─── Model Router ───────────────────────────────────────────────────

export class AiGatewayRouter {
  private registry: Map<TaskIntent, RouteConfig>;
  private anthropic: Anthropic;
  private mistral: MistralClient;

  constructor() {
    this.registry = CAPABILITY_REGISTRY;

    const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    const mistralKey = process.env.MISTRAL_API_KEY || '';

    this.anthropic = new Anthropic({ apiKey: anthropicKey });
    this.mistral = new MistralClient({ apiKey: mistralKey });
  }

  /**
   * Route an intent to the appropriate LLM provider with fallback.
   */
  public async executeIntent(intent: TaskIntent, prompt: string, systemPrompt?: string): Promise<string> {
    const config = this.registry.get(intent);
    if (!config) {
      throw new Error(`Unknown intent category: ${intent}. Available: ${[...this.registry.keys()].join(', ')}`);
    }

    try {
      return await this.dispatchCall(config.primaryProvider, config, prompt, systemPrompt);
    } catch (error) {
      console.warn(`[AiGateway] Primary provider ${config.primaryProvider} failed for intent "${intent}". Falling back to ${config.fallbackProvider}.`, error);
      try {
        return await this.dispatchCall(config.fallbackProvider, config, prompt, systemPrompt);
      } catch (fallbackError) {
        console.error(`[AiGateway] Both primary and fallback failed for intent "${intent}".`);
        throw fallbackError;
      }
    }
  }

  /**
   * Register or override a route configuration at runtime.
   */
  public registerIntent(intent: TaskIntent, config: RouteConfig): void {
    this.registry.set(intent, config);
  }

  /**
   * List all registered intents and their providers.
   */
  public getCapabilityReport(): Array<{ intent: TaskIntent; primary: string; fallback: string; model: string }> {
    return [...this.registry.entries()].map(([intent, config]) => ({
      intent,
      primary: config.primaryProvider,
      fallback: config.fallbackProvider,
      model: config.model,
    }));
  }

  // ─── Provider Dispatchers ────────────────────────────────────────

  private async dispatchCall(
    provider: string,
    config: RouteConfig,
    prompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    switch (provider) {
      case 'claude':
        return this.callClaude(config, prompt, systemPrompt);
      case 'mistral':
        return this.callMistral(config, prompt, systemPrompt);
      case 'fireworks':
        return this.callFireworks(config, prompt, systemPrompt);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async callClaude(config: RouteConfig, prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemPrompt || undefined,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content && content.type === 'text') {
      return content.text;
    }
    return '';
  }

  private async callMistral(config: RouteConfig, prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.mistral.chat({
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      messages: messages as any,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async callFireworks(config: RouteConfig, prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Fireworks API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// ─── Singleton Export ───────────────────────────────────────────────

export const aiGateway = new AiGatewayRouter();
