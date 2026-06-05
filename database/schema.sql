-- FlowForge canonical database schema
-- Run manually in the Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- recipes
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description text CHECK (char_length(description) <= 500),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- recipe_steps
CREATE TABLE recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_order integer NOT NULL CHECK (step_order >= 0),
  step_type text NOT NULL CHECK (step_type IN ('deploy', 'interact')),
  label text NOT NULL CHECK (char_length(label) >= 1 AND char_length(label) <= 80),
  contract_name text,
  abi jsonb NOT NULL DEFAULT '[]'::jsonb,
  bytecode text,
  target_address text,
  function_name text,
  constructor_params jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (recipe_id, step_order)
);

-- executions
CREATE TABLE executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chain_id integer NOT NULL,
  chain_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'partial', 'success', 'failed')),
  step_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- indexes
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_steps_order ON recipe_steps(recipe_id, step_order);
CREATE INDEX idx_executions_recipe_id ON executions(recipe_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- row level security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

-- recipes policies
CREATE POLICY recipes_select ON recipes
  FOR SELECT
  USING ((auth.uid() = user_id) OR (is_public = true));

CREATE POLICY recipes_insert ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipes_update ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY recipes_delete ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- recipe_steps policies
CREATE POLICY recipe_steps_select ON recipe_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
        AND (recipes.user_id = auth.uid() OR recipes.is_public = true)
    )
  );

CREATE POLICY recipe_steps_insert ON recipe_steps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY recipe_steps_update ON recipe_steps
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY recipe_steps_delete ON recipe_steps
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_steps.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

-- executions policies
CREATE POLICY executions_select ON executions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY executions_insert ON executions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY executions_update ON executions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY executions_delete ON executions
  FOR DELETE
  USING (auth.uid() = user_id);
