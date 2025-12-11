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
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

const CompileContractInputSchema = z.object({
  contractName: z.string().describe('The name of the main contract to compile.'),
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
    const tempDir = path.join('/tmp', `solc-compile-${Date.now()}`);
    const filePath = path.join(tempDir, 'Contract.sol');

    try {
      // 1. Create a temporary directory and write the Solidity file
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(filePath, input.solidityCode);

      // 2. Install solc in the temp directory
      await execAsync(`cd ${tempDir} && npm i solc@0.8.20`);

      // 3. Compile the contract using a Node.js script
      const compilerScript = `
        const solc = require('solc');
        const fs = require('fs');
        const path = require('path');

        const contractPath = path.resolve('${filePath}');
        const source = fs.readFileSync(contractPath, 'utf8');

        const input = {
            language: 'Solidity',
            sources: {
                'Contract.sol': {
                    content: source,
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
        
        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        if (output.errors) {
            const errorMessages = output.errors.map(err => err.formattedMessage).join('\\n');
            if (errorMessages.toLowerCase().includes('error')) {
                throw new Error('Compilation failed:\\n' + errorMessages);
            }
        }
        
        const compiledContract = output.contracts['Contract.sol']['${input.contractName}'];
        if (!compiledContract) {
            throw new Error('Contract name "${input.contractName}" not found in compiled output.');
        }

        const abi = compiledContract.abi;
        const bytecode = '0x' + compiledContract.evm.bytecode.object;

        console.log(JSON.stringify({ abi, bytecode }));
      `;

      const { stdout, stderr } = await execAsync(`node -e "${compilerScript.replace(/"/g, '\\"')}"`);

      if (stderr) {
        throw new Error(`Compilation script error: ${stderr}`);
      }

      const { abi, bytecode } = JSON.parse(stdout);
      
      return { abi, bytecode };
    } catch (error: any) {
      console.error('Full compilation error:', error);
      throw new Error(error.message || 'An unexpected error occurred during compilation.');
    } finally {
      // 4. Clean up the temporary directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
);


export async function compileContract(input: CompileContractInput): Promise<CompileContractOutput> {
    return compileSolidityFlow(input);
}
