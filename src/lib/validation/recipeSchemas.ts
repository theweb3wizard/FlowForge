import { z } from 'zod';

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const VARIABLE_REF_PATTERN = /^\$\{step_\d+\.contractAddress\}$/;

export const stepParamConfigSchema = z
  .object({
    name: z.string(),
    type: z.string(),
    value: z.string(),
    isVariable: z.boolean(),
    variableRef: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.isVariable && !data.variableRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A variable reference must be selected when "Use Variable" is enabled.',
        path: ['variableRef'],
      });
    }
  });

export const deployStepSchema = z.object({
  label: z.string().min(1, 'Step label is required'),
  abi: z
    .array(z.unknown())
    .min(1, 'ABI is required. Upload a JSON ABI file.'),
  bytecode: z
    .string()
    .min(1, 'Bytecode is required')
    .refine((val) => val.startsWith('0x'), {
      message: 'Bytecode must start with 0x',
    }),
  constructorParams: z.array(stepParamConfigSchema),
});

export const interactStepSchema = z.object({
  label: z.string().min(1, 'Step label is required'),
  abi: z
    .array(z.unknown())
    .min(1, 'ABI is required. Upload a JSON ABI file.'),
  functionName: z.string().min(1, 'A function must be selected'),
  targetAddress: z
    .string()
    .min(1, 'Target address is required')
    .refine(
      (val) => ADDRESS_PATTERN.test(val) || VARIABLE_REF_PATTERN.test(val),
      {
        message:
          'Must be a valid 0x address or a variable reference (e.g. ${step_0.contractAddress})',
      },
    ),
  constructorParams: z.array(stepParamConfigSchema),
});

export const recipeMetaSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(100),
  description: z.string().max(500).optional(),
});

export type StepParamConfigSchema = z.infer<typeof stepParamConfigSchema>;
export type DeployStepSchema = z.infer<typeof deployStepSchema>;
export type InteractStepSchema = z.infer<typeof interactStepSchema>;
export type RecipeMetaSchema = z.infer<typeof recipeMetaSchema>;
