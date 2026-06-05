import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';

// Map Lemon Squeezy variant IDs to plan names.
// Set these env vars to your actual variant IDs in production.
const VARIANT_TO_PLAN: Record<string, string> = {
  [process.env.LS_VARIANT_BUILDER ?? 'builder_variant']: 'builder',
  [process.env.LS_VARIANT_TEAM ?? 'team_variant']: 'team',
};

type LsOrderAttributes = {
  variant_id: number;
  user_email: string;
  user_name: string;
  status: string;
};

type LsSubscriptionAttributes = {
  variant_id: number;
  user_email: string;
  status: string;
};

type LsEvent = {
  meta: {
    event_name: string;
  };
  data: {
    attributes: LsOrderAttributes | LsSubscriptionAttributes;
  };
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let event: LsEvent;
  try {
    event = JSON.parse(rawBody) as LsEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event_name } = event.meta;

  if (
    event_name !== 'order_created' &&
    event_name !== 'subscription_created'
  ) {
    // Acknowledge but ignore other event types
    return NextResponse.json({ received: true });
  }

  const attrs = event.data.attributes;
  const variantId = String(attrs.variant_id);
  const userEmail = attrs.user_email;
  const plan = VARIANT_TO_PLAN[variantId];

  if (!plan) {
    console.warn(`Unknown variant ID: ${variantId}. No plan mapping found.`);
    return NextResponse.json({ received: true });
  }

  try {
    const supabase = await createServerClient();

    // Find the Supabase user by email
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Failed to list users:', listError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    const matchedUser = users.find(
      (u) => u.email?.toLowerCase() === userEmail.toLowerCase(),
    );

    if (!matchedUser) {
      // User may not have signed up yet — log and proceed gracefully
      console.warn(`No user found for email: ${userEmail}`);
      return NextResponse.json({ received: true });
    }

    // Update the user's metadata with the plan
    const { error: updateError } =
      await supabase.auth.admin.updateUserById(matchedUser.id, {
        user_metadata: { plan },
      });

    if (updateError) {
      console.error('Failed to update user plan:', updateError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
