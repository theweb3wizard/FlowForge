import { createHmac, timingSafeEqual } from 'crypto';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

type CheckoutResponse = {
  data: {
    attributes: {
      url: string;
    };
  };
};

/**
 * Creates a Lemon Squeezy checkout session for a given variant.
 * Returns the checkout URL to redirect the user to.
 * Server-only — never call from client components.
 */
export async function createCheckoutUrl(
  variantId: string,
  userEmail?: string,
): Promise<string> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    throw new Error(
      'Missing Lemon Squeezy environment variables. Set LEMON_SQUEEZY_API_KEY and NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID.',
    );
  }

  const body: Record<string, unknown> = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_options: {
          embed: false,
        },
        ...(userEmail
          ? {
              checkout_data: {
                email: userEmail,
              },
            }
          : {}),
      },
      relationships: {
        store: {
          data: { type: 'stores', id: storeId },
        },
        variant: {
          data: { type: 'variants', id: variantId },
        },
      },
    },
  };

  const response = await fetch(`${LS_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Lemon Squeezy checkout error:', text);
    throw new Error('Failed to create Lemon Squeezy checkout session.');
  }

  const json = (await response.json()) as CheckoutResponse;
  return json.data.attributes.url;
}

/**
 * Verifies the HMAC-SHA256 signature on an incoming Lemon Squeezy webhook.
 * Returns true if the signature is valid, false otherwise.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('LEMON_SQUEEZY_WEBHOOK_SECRET is not set.');
    return false;
  }

  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const digest = Buffer.from(hmac.digest('hex'), 'hex');
    const sigBuffer = Buffer.from(signature, 'hex');

    if (digest.length !== sigBuffer.length) {
      return false;
    }

    return timingSafeEqual(digest, sigBuffer);
  } catch {
    return false;
  }
}
