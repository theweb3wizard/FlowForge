import { pgTable, text, integer, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const stepTypeEnum = pgEnum('step_type', ['deploy', 'interact']);

export const executionStatusEnum = pgEnum('execution_status', ['pending', 'running', 'partial', 'success', 'failed']);

export const recipes = pgTable('recipes', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  sourceCode: text('source_code'),
  compilerVersion: text('compiler_version'),
  playgroundData: jsonb('playground_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const recipeSteps = pgTable('recipe_steps', {
  id: text('id').primaryKey().notNull(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  stepOrder: integer('step_order').notNull(),
  stepType: stepTypeEnum('step_type').notNull(),
  label: text('label').notNull(),
  contractName: text('contract_name'),
  abi: jsonb('abi'),
  bytecode: text('bytecode'),
  targetAddress: text('target_address'),
  functionName: text('function_name'),
  constructorParams: jsonb('constructor_params'),
});

export const executions = pgTable('executions', {
  id: text('id').primaryKey().notNull(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  chainId: integer('chain_id').notNull(),
  chainName: text('chain_name').notNull(),
  status: executionStatusEnum('status').default('pending').notNull(),
  stepResults: jsonb('step_results').default([]).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const generationLog = pgTable('generation_log', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id'),
  anonToken: text('anon_token'),
  prompt: text('prompt').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  tokensUsed: integer('tokens_used'),
  modelUsed: text('model_used'),
  compilationSuccess: boolean('compilation_success'),
  securityFlags: jsonb('security_flags'),
});

export const deployments = pgTable('deployments', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull(),
  recipeId: text('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  network: text('network').notNull(),
  contractAddress: text('contract_address'),
  transactionHash: text('transaction_hash'),
  deployerAddress: text('deployer_address'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
