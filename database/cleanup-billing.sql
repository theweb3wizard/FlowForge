-- ============================================================================
-- FlowForge Billing Cleanup Migration
-- Run this in your Supabase SQL Editor after removing Paddle billing code.
--
-- This script:
-- 1. Clears user_metadata.plan on all auth users (sets to 'free')
-- 2. Removes any leftover billing/subscription references
-- 3. Is safe to run multiple times (idempotent)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Reset all user plans to free
--    The plan field in user_metadata was previously set by the Paddle webhook
--    handler. Since FlowForge is now free and open source, all users should
--    have unrestricted access.
-- --------------------------------------------------------------------------
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM auth.users
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data = 
        raw_user_meta_data - 'plan' || '{"plan": "free"}'::jsonb
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- 2. Verify the cleanup
--    Returns a count of users grouped by their plan status.
--    All users should show 'free'.
-- --------------------------------------------------------------------------
SELECT 
  raw_user_meta_data->>'plan' AS plan,
  COUNT(*) AS user_count
FROM auth.users
GROUP BY raw_user_meta_data->>'plan'
ORDER BY plan;

-- --------------------------------------------------------------------------
-- 3. Remove any stale or orphaned data (safe to run anytime)
--    Note: FlowForge has no billing tables in the public schema, but
--    this step ensures any future remnants are caught.
-- --------------------------------------------------------------------------
-- No billing tables to drop — the schema only has recipes, recipe_steps,
-- and executions. Plan data was stored exclusively in auth.users metadata.

-- ============================================================================
-- Done. All billing infrastructure has been removed from the codebase.
-- ============================================================================
