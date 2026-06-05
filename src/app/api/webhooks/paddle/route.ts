import { NextRequest, NextResponse } from 'next/server';
import { EventName } from '@paddle/paddle-node-sdk';
import { getPaddleInstance, getPlanFromPriceId } from '@/lib/paddle';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Paddle webhook handler.
 *
 * Paddle sends webhooks for all subscription lifecycle events.
 * This route handles:
 *   - subscription.activated  → grant plan access
 *   - subscription.updated    → handle plan upgrades/downgrades
 *   - subscription.canceled   → revert to free plan
 *
 * Security: paddle.webhooks.unmarshal() verifies the HMAC-SHA256
 * signature and parses the typed event in one atomic operation.
 * If verification fails, it throws — we catch and return 401.
 *
 * IMPORTANT: Do NOT call req.json() before this handler.
 * unmarshal() needs the raw body string for signature verification.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get('paddle-signature') ?? '';
  const secretKey = process.env.PADDLE_WEBHOOK_SECRET_KEY ?? '';

  if (!secretKey) {
    console.error('PADDLE_WEBHOOK_SECRET_KEY is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const paddle = getPaddleInstance();

  // unmarshal verifies signature AND returns a fully-typed EventEntity
  let event: Awaited<ReturnType<typeof paddle.webhooks.unmarshal>>;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, secretKey, signature);
  } catch (err) {
    console.error('Paddle webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!event) {
    return NextResponse.json({ error: 'Empty event' }, { status: 400 });
  }

  // Only handle subscription lifecycle events
  const relevantEvents = [
    EventName.SubscriptionActivated,
    EventName.SubscriptionUpdated,
    EventName.SubscriptionCanceled,
  ];

  if (!relevantEvents.includes(event.eventType as EventName)) {
    // Acknowledge all other events — do not return error
    return NextResponse.json({ received: true });
  }

  try {
    const supabase = await createServerClient();

    if (
      event.eventType === EventName.SubscriptionActivated ||
      event.eventType === EventName.SubscriptionUpdated
    ) {
      const subscriptionData = event.data;

      // Extract the price ID from the first subscription item
      const priceId =
        'items' in subscriptionData &&
        Array.isArray(subscriptionData.items) &&
        subscriptionData.items[0]?.price?.id;

      if (!priceId) {
        console.warn('Paddle webhook: no price ID found in subscription data');
        return NextResponse.json({ received: true });
      }

      const plan = getPlanFromPriceId(priceId);

      if (!plan) {
        console.warn(`Paddle webhook: no plan mapped for price ID: ${priceId}`);
        return NextResponse.json({ received: true });
      }

      // Get the customer email to find the matching Supabase user
      const customerEmail =
        'customerId' in subscriptionData
          ? await getEmailFromCustomerId(supabase, String(subscriptionData.customerId), paddle)
          : null;

      if (!customerEmail) {
        console.warn('Paddle webhook: could not resolve customer email');
        return NextResponse.json({ received: true });
      }

      await updateUserPlan(supabase, customerEmail, plan);
    }

    if (event.eventType === EventName.SubscriptionCanceled) {
      const subscriptionData = event.data;

      const customerEmail =
        'customerId' in subscriptionData
          ? await getEmailFromCustomerId(supabase, String(subscriptionData.customerId), paddle)
          : null;

      if (customerEmail) {
        // Revert to free plan on cancellation
        await updateUserPlan(supabase, customerEmail, 'free');
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Paddle webhook processing error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getEmailFromCustomerId(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  customerId: string,
  paddle: ReturnType<typeof getPaddleInstance>,
): Promise<string | null> {
  try {
    // Fetch the customer from Paddle to get their email
    const customer = await paddle.customers.get(customerId);
    return customer.email ?? null;
  } catch (err) {
    console.error('Failed to fetch Paddle customer:', err);
    return null;
  }
}

async function updateUserPlan(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userEmail: string,
  plan: 'free' | 'builder' | 'team',
): Promise<void> {
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Failed to list Supabase users:', listError);
    return;
  }

  const matchedUser = users.find(
    (u) => u.email?.toLowerCase() === userEmail.toLowerCase(),
  );

  if (!matchedUser) {
    console.warn(`No Supabase user found for email: ${userEmail}`);
    return;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    matchedUser.id,
    { user_metadata: { plan } },
  );

  if (updateError) {
    console.error('Failed to update user plan:', updateError);
  } else {
    console.log(`Updated user ${matchedUser.id} to plan: ${plan}`);
  }
}
