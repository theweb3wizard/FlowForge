'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSwitchChain, useDeployContract } from 'wagmi';
import { waitForTransactionReceipt, getPublicClient } from '@wagmi/core';
import { wagmiConfig } from '@/config/wagmi';
import { Network, Rocket, CheckCircle, ExternalLink, Loader2, Copy, Check, FilePlus, Fuel } from 'lucide-react';
import { SUPPORTED_CHAINS, getExplorerAddressUrl, getChainById } from '@/config/chains';
import { createRecipeFromPlaygroundAction } from '@/lib/actions/recipeActions';

type Props = {
  code: string;
  abi: unknown[];
  bytecode: string | null;
  onDeployed: (address: string, chainId: number) => void;
};

const DEPLOY_CHAINS = SUPPORTED_CHAINS.filter((c) => c.isTestnet);

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-md hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function DeployPanel({ code, abi, bytecode, onDeployed }: Props) {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { deployContractAsync } = useDeployContract();

  const router = useRouter();
  const estimateAbortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState<'network' | 'deploy' | 'success'>('network');
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  const selectedChain = selectedChainId ? getChainById(selectedChainId) : null;

  const estimateGas = useCallback(async (chainId: number) => {
    // Abort any previous in-flight estimate
    if (estimateAbortRef.current) estimateAbortRef.current.abort();
    estimateAbortRef.current = new AbortController();
    const signal = estimateAbortRef.current.signal;

    setIsEstimatingGas(true);
    setEstimatedGas(null);

    try {
      // Use chain-specific public client instead of the connected wallet's chain
      const client = getPublicClient(wagmiConfig, { chainId });
      if (!client) throw new Error('No public client for chain');

      const gas = await client.estimateGas({
        data: `0x${bytecode}` as `0x${string}`,
      });
      if (!signal.aborted) {
        setEstimatedGas(gas.toString());
      }
    } catch {
      if (!signal.aborted) {
        setEstimatedGas(null);
      }
    } finally {
      if (!signal.aborted) {
        setIsEstimatingGas(false);
      }
    }
  }, [bytecode]);

  const handleDeploy = useCallback(async () => {
    if (!selectedChainId || !bytecode || !isConnected) return;

    setIsDeploying(true);
    setError(null);

    try {
      await switchChainAsync({ chainId: selectedChainId });

      const hash = await deployContractAsync({
        abi: abi,
        bytecode: bytecode as `0x${string}`,
        chainId: selectedChainId,
      });

      setTxHash(hash);

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        chainId: selectedChainId,
      });

      if (receipt.contractAddress) {
        setContractAddress(receipt.contractAddress);
        setStep('success');
        onDeployed(receipt.contractAddress, selectedChainId);
      } else {
        throw new Error('No contract address in receipt');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  }, [selectedChainId, bytecode, abi, isConnected, deployContractAsync, switchChainAsync, onDeployed]);

  if (step === 'network') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Network className="w-5 h-5 text-indigo" />
          <h2 className="text-lg font-semibold">Select Network</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEPLOY_CHAINS.map((chain) => (
            <button
              key={chain.id}
                  onClick={() => { setSelectedChainId(chain.id); setStep('deploy'); estimateGas(chain.id); }}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedChainId === chain.id
                  ? 'border-indigo/60 bg-indigo/5'
                  : 'border-border/50 bg-card/30 hover:border-border hover:bg-card/50'
              }`}
            >
              <p className="font-medium text-sm">{chain.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{chain.shortName}</p>
            </button>
          ))}
        </div>
        {!isConnected && (
          <div className="mt-4 p-3 rounded-lg bg-amber/10 border border-amber/20 text-amber text-xs">
            Connect your wallet to deploy
          </div>
        )}
      </div>
    );
  }

  if (step === 'deploy') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Rocket className="w-5 h-5 text-indigo" />
          <h2 className="text-lg font-semibold">Deploy to {selectedChain?.name}</h2>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-card/30 p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-2">
              Contract Preview
            </p>
            <pre className="text-xs text-muted-foreground max-h-40 overflow-y-auto font-mono leading-relaxed">
              {code.slice(0, 1000)}{code.length > 1000 ? '\n// ...' : ''}
            </pre>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/50">
            <span className="text-xs text-muted-foreground">Network</span>
            <span className="text-xs font-medium text-foreground">{selectedChain?.name}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/50">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Fuel className="w-3 h-3" />
              Estimated Gas
            </span>
            <span className="text-xs font-medium text-foreground">
              {isEstimatingGas ? (
                <span className="text-muted-foreground">Estimating...</span>
              ) : estimatedGas ? (
                `${estimatedGas} units`
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('network'); setError(null); }}
              className="px-4 py-2.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              Back
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="flex-1 py-2.5 bg-indigo hover:bg-indigo/90 disabled:opacity-40 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Deploy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const chain = selectedChainId ? getChainById(selectedChainId) : null;

    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald" />
          </div>
          <h2 className="text-xl font-semibold mb-1">Deployed Successfully</h2>
          <p className="text-sm text-muted-foreground">
            Contract deployed to {chain?.name}
          </p>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          <div className="rounded-lg border border-border/50 bg-card/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">Contract Address</span>
              <CopyButton text={contractAddress ?? ''} />
            </div>
            <p className="text-xs font-mono text-foreground mt-1 break-all">{contractAddress}</p>
          </div>

          {chain && contractAddress && (
            <a
              href={getExplorerAddressUrl(chain, contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-indigo hover:text-indigo/80 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              View on {chain.explorerName}
            </a>
          )}

          <button
            onClick={async () => {
              setIsCreatingRecipe(true);
              try {
                const result = await createRecipeFromPlaygroundAction(
                  `Playground ${(contractAddress ?? '').slice(0, 6)}`,
                  code,
                  abi,
                  bytecode,
                );
                if (result.recipeId) {
                  router.push(`/recipe/${result.recipeId}/builder`);
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create recipe');
              } finally {
                setIsCreatingRecipe(false);
              }
            }}
            disabled={isCreatingRecipe}
            className="w-full py-2.5 bg-card hover:bg-card/80 border border-border/50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isCreatingRecipe ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FilePlus className="w-4 h-4" />
            )}
            Open in Recipe Builder
          </button>
        </div>
      </div>
    );
  }

  return null;
}

