'use client';

import { useState, useCallback } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
  useSwitchChain,
} from 'wagmi';
import { isAddress, parseEther, formatEther, type Abi } from 'viem';
import { Search, Loader2, Play, Send, Info, AlertCircle, Copy, Check } from 'lucide-react';

type AbiFunction = {
  name: string;
  type: string;
  stateMutability?: string;
  inputs: Array<{ name: string; type: string; internalType?: string }>;
  outputs: Array<{ name: string; type: string }>;
};

const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-md hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all"
      title={label}
    >
      {copied ? <Check className="w-3 h-3 text-emerald" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ReadFunctionCard({ fn, abi, address }: { fn: AbiFunction; abi: Abi; address: `0x${string}` }) {
  const [args, setArgs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);

  const { data, isFetching, refetch } = useReadContract({
    address,
    abi,
    functionName: fn.name,
    args: fn.inputs.length > 0
      ? fn.inputs.map((inp) => {
          const val = args[inp.name] ?? '';
          if (inp.type === 'uint256' || inp.type.startsWith('uint')) return val ? BigInt(val) : 0n;
          if (inp.type === 'bool') return val === 'true';
          return val;
        })
      : undefined,
    query: { enabled: false },
  });

  const handleCall = useCallback(async () => {
    const { data: resultData } = await refetch();
    setResult(resultData !== undefined ? String(resultData) : 'No return value');
  }, [refetch]);

  return (
    <div className="border border-border/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald text-xs">▶</span>
          <span className="text-sm font-mono text-foreground">{fn.name}</span>
        </div>
        <button
          onClick={handleCall}
          disabled={isFetching}
          className="text-xs px-2.5 py-1 rounded-md bg-card/60 hover:bg-card border border-border/50 text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
        >
          {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Call'}
        </button>
      </div>
      {fn.inputs.length > 0 && (
        <div className="space-y-1.5 pl-4">
          {fn.inputs.map((inp) => (
            <input
              key={inp.name}
              placeholder={`${inp.name}: ${inp.type}`}
              value={args[inp.name] ?? ''}
              onChange={(e) => setArgs((prev) => ({ ...prev, [inp.name]: e.target.value }))}
              className="w-full bg-background/60 border border-border/30 rounded px-2 py-1 text-xs font-mono text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-indigo/50"
            />
          ))}
        </div>
      )}
      {result && (
        <div className="pl-4 flex items-start gap-2">
          <span className="text-[10px] text-muted-foreground mt-0.5">→</span>
          <pre className="text-xs text-muted-foreground flex-1 break-all">{result}</pre>
          <CopyButton text={result} />
        </div>
      )}
    </div>
  );
}

function WriteFunctionCard({ fn, abi, address }: { fn: AbiFunction; abi: Abi; address: `0x${string}` }) {
  const { address: userAddress } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [args, setArgs] = useState<Record<string, string>>({});
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWrite = useCallback(async () => {
    if (!userAddress) return;
    setError(null);
    setTxHash(null);

    try {
      const encodedArgs = fn.inputs.map((inp) => {
        const val = args[inp.name] ?? '';
        if (inp.type === 'uint256' || inp.type.startsWith('uint')) return val ? BigInt(val) : 0n;
        if (inp.type === 'bool') return val === 'true';
        if (inp.type === 'address') return val as `0x${string}`;
        return val;
      });

      const hash = await writeContractAsync({
        address,
        abi,
        functionName: fn.name,
        args: encodedArgs,
      });
      setTxHash(hash);
    } catch (err: any) {
      setError(err?.message ?? 'Transaction failed');
    }
  }, [address, abi, fn, args, writeContractAsync, userAddress]);

  return (
    <div className="border border-border/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber text-xs">✏</span>
          <span className="text-sm font-mono text-foreground">{fn.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {userAddress && (
            <button
              onClick={handleWrite}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded-md bg-indigo/80 hover:bg-indigo text-white transition-all disabled:opacity-40 flex items-center gap-1"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Send
            </button>
          )}
        </div>
      </div>
      {fn.inputs.length > 0 && (
        <div className="space-y-1.5 pl-4">
          {fn.inputs.map((inp) => (
            <input
              key={inp.name}
              placeholder={`${inp.name}: ${inp.type}`}
              value={args[inp.name] ?? ''}
              onChange={(e) => setArgs((prev) => ({ ...prev, [inp.name]: e.target.value }))}
              className="w-full bg-background/60 border border-border/30 rounded px-2 py-1 text-xs font-mono text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-indigo/50"
            />
          ))}
        </div>
      )}
      {txHash && (
        <div className="pl-4 flex items-start gap-2">
          <span className="text-emerald text-[10px] mt-0.5">✓</span>
          <span className="text-xs text-muted-foreground break-all font-mono">{txHash}</span>
          <CopyButton text={txHash} />
        </div>
      )}
      {error && (
        <div className="pl-4 flex items-start gap-2 text-destructive">
          <AlertCircle className="w-3 h-3 mt-0.5" />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
}

export function InteractPanel() {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [contractAddress, setContractAddress] = useState('');
  const [abi, setAbi] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFunctions = (abi ?? []).filter(
    (fn: AbiFunction) => fn.type === 'function' && (fn.stateMutability === 'view' || fn.stateMutability === 'pure'),
  );
  const writeFunctions = (abi ?? []).filter(
    (fn: AbiFunction) => fn.type === 'function' && fn.stateMutability !== 'view' && fn.stateMutability !== 'pure',
  );

  const loadContract = useCallback(async () => {
    if (!isAddress(contractAddress)) {
      setError('Invalid address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAbi(null);

    try {
      // Try Etherscan first
      const chainId = window.localStorage.getItem('ff_chain_id') ?? '11155111';
      const explorerMap: Record<string, string> = {
        '1': 'api.etherscan.io',
        '11155111': 'api-sepolia.etherscan.io',
        '8453': 'api.basescan.org',
        '84532': 'api-sepolia.basescan.org',
        '137': 'api.polygonscan.com',
        '42161': 'api.arbiscan.io',
        '10': 'api-optimistic.etherscan.io',
        '56': 'api.bscscan.com',
      };

      const baseUrl = explorerMap[chainId] ?? 'api-sepolia.etherscan.io';
      const res = await fetch(
        `https://${baseUrl}/api?module=contract&action=getabi&address=${contractAddress}`,
      );
      const data = await res.json();

      if (data.status === '1' && data.result) {
        const parsed = JSON.parse(data.result);
        setAbi(parsed);
      } else {
        setError('ABI not found on explorer. Load ABI from a local JSON file.');
      }
    } catch (err) {
      setError('Failed to load contract');
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  const handleAbiUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setAbi(parsed);
        setError(null);
      } catch {
        setError('Invalid ABI JSON');
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-80 border-r border-border/50 overflow-y-auto p-4 space-y-4 flex-shrink-0">
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
            Contract Address
          </label>
          <div className="flex gap-2">
            <input
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-card/60 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo/60 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && loadContract()}
            />
            <button
              onClick={loadContract}
              disabled={!ETHEREUM_ADDRESS_REGEX.test(contractAddress) || isLoading}
              className="px-3 py-2 bg-indigo/80 hover:bg-indigo disabled:opacity-40 rounded-lg transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-[10px] text-muted-foreground/40">or</span>
            <div className="h-px flex-1 bg-border/30" />
          </div>
          <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border/50 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-indigo/40 cursor-pointer transition-all">
            Load ABI from file
            <input type="file" accept=".json" onChange={handleAbiUpload} className="hidden" />
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-destructive text-xs">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isConnected && (
          <div className="text-center py-8 text-muted-foreground/50 text-xs">
            Connect wallet to interact with write functions
          </div>
        )}

        {abi && (
          <div className="space-y-4">
            {readFunctions.length > 0 && (
              <div>
                <h3 className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-2 flex items-center gap-1.5">
                  <span className="text-emerald">●</span>
                  Read Functions
                </h3>
                <div className="space-y-2">
                  {readFunctions.map((fn: AbiFunction, i: number) => (
                    <ReadFunctionCard key={i} fn={fn} abi={abi as Abi} address={contractAddress as `0x${string}`} />
                  ))}
                </div>
              </div>
            )}
            {writeFunctions.length > 0 && (
              <div>
                <h3 className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-2 flex items-center gap-1.5">
                  <span className="text-amber">●</span>
                  Write Functions
                </h3>
                <div className="space-y-2">
                  {writeFunctions.map((fn: AbiFunction, i: number) => (
                    <WriteFunctionCard key={i} fn={fn} abi={abi as Abi} address={contractAddress as `0x${string}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!abi && (
          <div className="text-center py-12 text-muted-foreground/40 text-xs">
            Enter a contract address and click Search, or load an ABI JSON from your computer
          </div>
        )}
      </div>

      <div className="hidden lg:flex flex-1 p-4 overflow-y-auto">
        <div className="text-muted-foreground/40 text-xs text-center mt-20 w-full">
          Select a function to see the output here
        </div>
      </div>
    </div>
  );
}

