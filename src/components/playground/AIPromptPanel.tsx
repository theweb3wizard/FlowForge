'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ChevronRight } from 'lucide-react';

const TEMPLATES = [
  { label: 'ERC-20 Token', prompt: 'An ERC-20 token called FORGE with 100M supply, 18 decimals, and an owner-only mint function' },
  { label: 'ERC-721 NFT', prompt: 'An ERC-721 NFT collection with a max supply of 10,000, public mint at 0.08 ETH, and metadata URI management' },
  { label: 'Multisig Wallet', prompt: 'A 2-of-3 multisig wallet that requires 2 owner signatures to execute transactions' },
  { label: 'Staking Pool', prompt: 'A staking contract where users stake an ERC-20 token and earn rewards proportional to their stake and time' },
  { label: 'Token Vesting', prompt: 'A token vesting contract with a 6-month cliff and 24-month linear vesting schedule' },
  { label: 'Minimal Proxy', prompt: 'An ERC-1167 minimal proxy factory that clones an implementation contract and initializes each clone with an owner address' },
];

type Props = {
  onCodeGenerated: (code: string) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
};

function getAnonToken(): string {
  let token = localStorage.getItem('ff_anon_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('ff_anon_token', token);
  }
  return token;
}

export function AIPromptPanel({ onCodeGenerated, isGenerating, setIsGenerating }: Props) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(promptText: string = prompt) {
    if (!promptText.trim() || isGenerating) return;

    setError(null);
    setIsGenerating(true);
    onCodeGenerated('// Generating...\n');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anon-token': getAnonToken(),
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (res.status === 429) {
        const data = await res.json();
        throw new Error(data.error ?? 'Rate limit reached');
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        onCodeGenerated(accumulated);
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Generation failed';
      setError(msg);
      onCodeGenerated(`// ⚠️ ${msg}\n// Try again or rephrase your prompt.`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
          Describe Your Contract
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
          }}
          placeholder="e.g. An ERC-20 token with a 2% burn on every transfer..."
          rows={5}
          className="w-full bg-card/60 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-indigo/60 transition-all font-mono leading-relaxed"
          disabled={isGenerating}
        />
        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-2.5 bg-indigo hover:bg-indigo/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Ctrl+Enter to generate
        </p>
        {error && (
          <p className="text-[11px] text-destructive text-center">{error}</p>
        )}
      </div>

      <div className="border-t border-border/50 pt-4 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-3">
          Templates
        </p>
        <div className="flex flex-col gap-1">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                setPrompt(t.prompt);
                handleGenerate(t.prompt);
              }}
              disabled={isGenerating}
              className="group flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-card/60 border border-transparent hover:border-border/40 transition-all"
            >
              <ChevronRight className="w-3 h-3 text-indigo/0 group-hover:text-indigo/60 transition-all" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

