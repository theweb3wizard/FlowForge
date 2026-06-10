-- FlowForge Playground Extension
-- Adds AI playground capabilities to existing schema

-- Extend recipes with playground data
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS source_code text,
  ADD COLUMN IF NOT EXISTS compiler_version text DEFAULT '0.8.26',
  ADD COLUMN IF NOT EXISTS playground_data jsonb DEFAULT '{}'::jsonb;

-- Generation log for AI usage tracking
CREATE TABLE IF NOT EXISTS generation_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_token    text,
  prompt        text NOT NULL,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  tokens_used   integer,
  model_used    text DEFAULT 'openrouter',
  compilation_success boolean,
  security_flags jsonb DEFAULT '[]'::jsonb
);

-- Deployments table (lightweight, for single deploys outside recipes)
CREATE TABLE IF NOT EXISTS deployments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id       uuid REFERENCES recipes(id) ON DELETE SET NULL,
  network         text NOT NULL,
  contract_address text NOT NULL,
  transaction_hash text NOT NULL,
  deployer_address text,
  status          text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generation_log_user_id ON generation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_anon_token ON generation_log(anon_token);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_recipe_id ON deployments(recipe_id);

-- RLS
ALTER TABLE generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Generation log policies
DROP POLICY IF EXISTS gen_log_select ON generation_log;
CREATE POLICY gen_log_select ON generation_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS gen_log_insert ON generation_log;
CREATE POLICY gen_log_insert ON generation_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Deployments policies
DROP POLICY IF EXISTS deployments_select ON deployments;
CREATE POLICY deployments_select ON deployments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS deployments_insert ON deployments;
CREATE POLICY deployments_insert ON deployments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS deployments_update ON deployments;
CREATE POLICY deployments_update ON deployments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
