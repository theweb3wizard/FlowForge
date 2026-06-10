import * as fs from 'fs';
import * as path from 'path';
import type { CompileError, CompileResult } from '@/types/playground';

let solcInstance: any = null;

async function getSolc(): Promise<any> {
  if (solcInstance) return solcInstance;
  try {
    const solc = await import('solc');
    solcInstance = solc.default ?? solc;
    return solcInstance;
  } catch (err) {
    throw new Error(`Failed to load solc compiler: ${err}`);
  }
}

const OZ_PREFIX = '@openzeppelin/contracts/';
const OZ_ROOT = path.join(process.cwd(), 'node_modules', '@openzeppelin', 'contracts');
const PRIMARY_SOURCE_NAME = 'contract.sol';

function findImports(
  importPath: string,
  resolvedPaths: Map<string, string>,
  primaryDir: string,
) {
  const normalized = importPath.replace(/\\/g, '/');

  if (normalized.startsWith(OZ_PREFIX)) {
    const relativePath = normalized.slice(OZ_PREFIX.length);
    const fullPath = path.join(OZ_ROOT, relativePath);

    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      resolvedPaths.set(normalized, fullPath);
      return { contents: content };
    }
    return { error: `OpenZeppelin file not found: ${normalized}` };
  }

  if (normalized.startsWith('./') || normalized.startsWith('../')) {
    // Resolve against the primary source's directory first
    const fromPrimary = path.resolve(primaryDir, normalized);
    if (fs.existsSync(fromPrimary)) {
      const content = fs.readFileSync(fromPrimary, 'utf-8');
      resolvedPaths.set(normalized, fromPrimary);
      return { contents: content };
    }

    // Fallback: try against all known OZ directories
    for (const knownFsPath of resolvedPaths.values()) {
      const knownDir = path.dirname(knownFsPath);
      const resolved = path.resolve(knownDir, normalized);
      if (fs.existsSync(resolved)) {
        const content = fs.readFileSync(resolved, 'utf-8');
        resolvedPaths.set(normalized, resolved);
        return { contents: content };
      }
    }

    return { error: `Import not found: ${normalized}` };
  }

  return { error: `Import not supported: ${normalized}` };
}

function parseSourceLocation(err: any): { line: number; column: number } {
  // Try formattedMessage first (standard solc output)
  if (err.formattedMessage) {
    const match = err.formattedMessage.match(/:(\d+):(\d+):/);
    if (match) {
      return { line: Number.parseInt(match[1], 10), column: Number.parseInt(match[2], 10) };
    }
  }

  // Try structured sourceLocation
  if (err.sourceLocation?.start) {
    return { line: Number.isFinite(err.sourceLocation.start) ? err.sourceLocation.start : 1, column: 1 };
  }

  return { line: 1, column: 1 };
}

export async function compileSolidity(
  sourceCode: string,
  contractName = 'Contract',
): Promise<CompileResult> {
  if (!sourceCode.trim()) {
    return {
      success: false,
      errors: [{ line: 1, column: 1, message: 'No source code provided', severity: 'error' }],
      warnings: [],
    };
  }

  const solc = await getSolc();

  // Per-request state: no shared mutable data across calls
  const resolvedPaths = new Map<string, string>();
  const primaryDir = path.dirname(path.resolve(PRIMARY_SOURCE_NAME));

  const input = {
    language: 'Solidity',
    sources: { [PRIMARY_SOURCE_NAME]: { content: sourceCode } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'] },
      },
    },
  };

  let output: any;
  try {
    output = JSON.parse(
      solc.compile(JSON.stringify(input), {
        import: (p: string) => findImports(p, resolvedPaths, primaryDir),
      }),
    );
  } catch (err) {
    return {
      success: false,
      errors: [{ line: 1, column: 1, message: `Compiler crashed: ${err}`, severity: 'error' }],
      warnings: [],
    };
  }

  const errors: CompileError[] = [];
  const warnings: CompileError[] = [];

  if (output.errors) {
    for (const err of output.errors) {
      const { line, column } = parseSourceLocation(err);
      const entry: CompileError = {
        line,
        column,
        message: err.message,
        severity: err.severity === 'error' ? 'error' : 'warning',
        formattedMessage: err.formattedMessage,
      };
      err.severity === 'error' ? errors.push(entry) : warnings.push(entry);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  const allContracts = output.contracts ?? {};
  // Collect all contract names from all source files
  const contractEntries: Array<{ file: string; name: string }> = [];
  for (const [file, contracts] of Object.entries(allContracts)) {
    for (const name of Object.keys(contracts)) {
      contractEntries.push({ file, name });
    }
  }

  if (contractEntries.length === 0) {
    return {
      success: false,
      errors: [{ line: 1, column: 1, message: 'No contracts found in source', severity: 'error' }],
      warnings,
    };
  }

  const primary = contractEntries[0];
  const primaryContract = allContracts[primary.file]?.[primary.name];

  if (!primaryContract) {
    return {
      success: false,
      errors: [{ line: 1, column: 1, message: `Contract ${primary.name} output not found`, severity: 'error' }],
      warnings,
    };
  }

  return {
    success: true,
    abi: primaryContract.abi,
    bytecode: primaryContract.evm?.bytecode?.object,
    contractName: primary.name,
    allContracts: contractEntries.map(({ file, name }) => ({
      file,
      name,
      abi: allContracts[file]?.[name]?.abi,
      bytecode: allContracts[file]?.[name]?.evm?.bytecode?.object,
    })),
    errors: [],
    warnings,
  };
}

// Lightweight compile that only returns errors (no ABI/bytecode parsing)
// Used by the AI fix loop for fast error checking
export async function checkCompileErrors(sourceCode: string): Promise<CompileError[]> {
  if (!sourceCode.trim()) {
    return [{ line: 1, column: 1, message: 'No source code provided', severity: 'error' }];
  }

  const solc = await getSolc();
  const resolvedPaths = new Map<string, string>();
  const primaryDir = path.dirname(path.resolve(PRIMARY_SOURCE_NAME));

  const input = {
    language: 'Solidity',
    sources: { [PRIMARY_SOURCE_NAME]: { content: sourceCode } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi'] } },
    },
  };

  let output: any;
  try {
    output = JSON.parse(
      solc.compile(JSON.stringify(input), {
        import: (p: string) => findImports(p, resolvedPaths, primaryDir),
      }),
    );
  } catch {
    return [{ line: 1, column: 1, message: 'Compiler crashed', severity: 'error' }];
  }

  const errors: CompileError[] = [];
  if (output.errors) {
    for (const err of output.errors) {
      if (err.severity !== 'error') continue;
      const { line, column } = parseSourceLocation(err);
      errors.push({ line, column, message: err.message, severity: 'error', formattedMessage: err.formattedMessage });
    }
  }
  return errors;
}
