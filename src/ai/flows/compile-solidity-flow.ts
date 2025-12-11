
'use server';
/**
 * @fileOverview An AI flow for compiling Solidity smart contracts.
 *
 * - compileContract - A function that compiles Solidity code and returns the ABI and bytecode.
 * - CompileContractInput - The input type for the compileContract function.
 * - CompileContractOutput - The return type for the compileContract function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import solc from 'solc';

const CompileContractInputSchema = z.object({
  sourceContractName: z.string().describe('The exact name of the main contract from the source code.'),
  solidityCode: z.string().describe('The full source code of the Solidity smart contract.'),
});
export type CompileContractInput = z.infer<typeof CompileContractInputSchema>;

const CompileContractOutputSchema = z.object({
  abi: z.any().describe('The Application Binary Interface (ABI) of the compiled contract.'),
  bytecode: z.string().describe('The bytecode of the compiled contract.'),
});
export type CompileContractOutput = z.infer<typeof CompileContractOutputSchema>;


const compileSolidityFlow = ai.defineFlow(
  {
    name: 'compileSolidityFlow',
    inputSchema: CompileContractInputSchema,
    outputSchema: CompileContractOutputSchema,
  },
  async (input) => {
    try {
      const compilerInput = {
        language: 'Solidity',
        sources: {
          'Contract.sol': {
            content: input.solidityCode,
          },
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode.object'],
            },
          },
        },
      };

      const output = JSON.parse(solc.compile(JSON.stringify(compilerInput)));

      if (output.errors) {
        const errorMessages = output.errors.map((err: any) => err.formattedMessage).join('\n');
        // Filter out non-error warnings
        const hasErrors = output.errors.some((err: any) => err.severity === 'error');
        if (hasErrors) {
          throw new Error(`Compilation failed:\n${errorMessages}`);
        }
      }

      const compiledContract = output.contracts['Contract.sol'][input.sourceContractName];
      if (!compiledContract) {
        throw new Error(`Contract name "${input.sourceContractName}" not found in compiled output. Available contracts: ${Object.keys(output.contracts['Contract.sol']).join(', ')}`);
      }

      const abi = compiledContract.abi;
      const bytecode = '0x' + compiledContract.evm.bytecode.object;

      if (!abi || !bytecode) {
          throw new Error('ABI or bytecode not found in compiled output.');
      }

      return { abi, bytecode };
    } catch (error: any) {
      console.error('Full compilation error:', error);
      throw new Error(error.message || 'An unexpected error occurred during compilation.');
    }
  }
);


export async function compileContract(input: CompileContractInput): Promise<CompileContractOutput> {
    return compileSolidityFlow(input);
}
