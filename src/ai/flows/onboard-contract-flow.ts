'use server';
/**
 * @fileOverview An AI flow for onboarding new smart contract templates.
 *
 * - onboardContract - A function that analyzes Solidity code to generate template metadata.
 * - OnboardContractInput - The input type for the onboardContract function.
 * - OnboardContractOutput - The return type for the onboardContract function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ParameterSchema = z.object({
  name: z.string().describe('A camelCase name for the parameter, e.g., "tokenName"'),
  label: z.string().describe('A human-readable label for the form field, e.g., "Token Name"'),
  type: z.enum(['text', 'number', 'address']).describe('The input type for the form field.'),
  placeholder: z.string().describe('Example placeholder text for the input field, e.g., "e.g., My Awesome Token"'),
});

const OnboardContractInputSchema = z.object({
  contractName: z.string().describe('The user-provided name for the contract template.'),
  solidityCode: z.string().describe('The full source code of the Solidity smart contract.'),
});
export type OnboardContractInput = z.infer<typeof OnboardContractInputSchema>;

const OnboardContractOutputSchema = z.object({
  description: z.string().describe('A concise, one-sentence description of what the smart contract does. This will be shown on the template card.'),
  icon: z.string().describe('The name of a single, relevant icon from the lucide-react library (e.g., "Coins", "ShieldCheck", "Lock"). Choose the best one that represents the contract\'s purpose.'),
  parameters: z.array(ParameterSchema).describe('An array of objects representing the constructor parameters needed to deploy this contract. Extract this from the constructor in the Solidity code.'),
});
export type OnboardContractOutput = z.infer<typeof OnboardContractOutputSchema>;


const onboarderPrompt = ai.definePrompt({
    name: 'contractOnboarderPrompt',
    input: { schema: OnboardContractInputSchema },
    output: { schema: OnboardContractOutputSchema },
    prompt: `You are an expert smart contract developer and UI designer. Your task is to analyze the provided Solidity smart contract and generate the necessary configuration for it to be used as a template in a no-code deployment platform called FlowForge.

Analyze the contract's purpose and constructor to generate the required fields.

Contract Name: {{{contractName}}}
Solidity Code:
\'\'\'solidity
{{{solidityCode}}}
\'\'\'

Based on the code, generate a JSON object that includes:
1.  A short 'description' of the contract's purpose.
2.  A single 'icon' name from the lucide-react library that best represents the contract.
3.  An array of 'parameters' derived ONLY from the contract's constructor. Each parameter object must have a 'name' (camelCase), a 'label' (human-readable), a 'type' ('text', 'number', or 'address'), and a 'placeholder' example.
`,
});


const onboardContractFlow = ai.defineFlow(
  {
    name: 'onboardContractFlow',
    inputSchema: OnboardContractInputSchema,
    outputSchema: OnboardContractOutputSchema,
  },
  async (input) => {
    const { output } = await onboarderPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid output.');
    }
    return output;
  }
);

export async function onboardContract(input: OnboardContractInput): Promise<OnboardContractOutput> {
    return onboardContractFlow(input);
}
