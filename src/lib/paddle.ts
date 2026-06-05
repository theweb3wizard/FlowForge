import { Paddle, Environment } from '@paddle/paddle-node-sdk';

/**
 * Returns a singleton Paddle server SDK instance.
 * Server-only — never import this in client components.
 *
 * Environment is driven by PADDLE_ENVIRONMENT:
 *   'sandbox'    → Paddle sandbox (use for local dev and testing)
 *   'production' → Paddle live environment
 */
let paddleInstance: Paddle | null = null;

export function getPaddleInstance(): Paddle {
  if (paddleInstance) return paddleInstance;

  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'PADDLE_API_KEY is not set. Add it to your .env.local file.',
    );
  }

  const environment =
    process.env.PADDLE_ENVIRONMENT === 'production'
      ? Environment.production
      : Environment.sandbox;

  paddleInstance = new Paddle(apiKey, { environment });
  return paddleInstance;
}

/**
 * Maps a Paddle Price ID to a FlowForge plan name.
 * Price IDs are set via NEXT_PUBLIC_PADDLE_PRICE_ID_BUILDER
 * and NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM environment variables.
 */
export function getPlanFromPriceId(priceId: string): 'builder' | 'team' | null {
  const builderPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_BUILDER;
  const teamPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM;

  if (builderPriceId && priceId === builderPriceId) return 'builder';
  if (teamPriceId && priceId === teamPriceId) return 'team';

  return null;
}
