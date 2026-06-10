'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal, Copy, Check, AlertTriangle, Shield, FileCode, Bug } from 'lucide-react';
import type { CompileResult, SecurityFinding } from '@/types/playground';

type ConsoleTab = 'output' | 'abi' | 'bytecode' | 'security';

type Props = {
  code: string;
  compileResult: CompileResult | null;
  isCompiling: boolean;
  onCompile: () => void;
  securityFindings: SecurityFinding[];
  onAudit: () => void;
  isAuditing: boolean;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1.5 rounded-md hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-destructive';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-amber';
    case 'low': return 'text-blue-400';
    default: return 'text-muted-foreground';
  }
}

function severityBg(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-destructive/10 border-destructive/30';
    case 'high': return 'bg-orange-500/10 border-orange-500/30';
    case 'medium': return 'bg-amber/10 border-amber/30';
    case 'low': return 'bg-blue-400/10 border-blue-400/30';
    default: return 'bg-card/30 border-border/30';
  }
}

export function CompileConsole({
  code,
  compileResult,
  isCompiling,
  onCompile,
  securityFindings,
  onAudit,
  isAuditing,
}: Props) {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('output');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [compileResult, securityFindings]);

  const tabs: { id: ConsoleTab; label: string; icon: any }[] = [
    { id: 'output', label: 'Output', icon: Terminal },
    { id: 'abi', label: 'ABI', icon: FileCode },
    { id: 'bytecode', label: 'Bytecode', icon: Bug },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-indigo border-indigo'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                {tab.id === 'security' && securityFindings.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-destructive/20 text-destructive">
                    {securityFindings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAudit}
            disabled={isAuditing || !code.trim() || code.includes('Generating')}
            className="text-xs px-3 py-1.5 rounded-md border border-border/50 hover:bg-card/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
          >
            {isAuditing ? 'Auditing...' : 'Audit'}
          </button>
          <button
            onClick={onCompile}
            disabled={isCompiling || !code.trim() || code.includes('Generating')}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo/90 hover:bg-indigo text-white font-medium transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            {isCompiling ? (
              <span className="animate-pulse">Compiling...</span>
            ) : (
              'Compile'
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
        {activeTab === 'output' && (
          <div className="space-y-2">
            {!compileResult && !isCompiling && (
              <div className="text-muted-foreground/50 italic py-4 text-center">
                Click Compile or press Ctrl+Enter to check your code
              </div>
            )}
            {isCompiling && (
              <div className="flex items-center gap-2 text-amber">
                <div className="h-3 w-3 rounded-full border-2 border-amber border-t-transparent animate-spin" />
                Compiling...
              </div>
            )}
            {compileResult && !isCompiling && (
              <>
                <div className={`flex items-center gap-2 ${compileResult.success ? 'text-emerald' : 'text-destructive'}`}>
                  <span className="text-base">
                    {compileResult.success ? '✅' : '❌'}
                  </span>
                  <span className="font-semibold">
                    {compileResult.success ? 'Compilation successful' : 'Compilation failed'}
                  </span>
                  {compileResult.contractName && (
                    <span className="text-muted-foreground ml-2">
                      — {compileResult.contractName}
                    </span>
                  )}
                </div>

                {compileResult.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-destructive pl-6">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Line {err.line}: {err.message}</span>
                  </div>
                ))}

                {compileResult.warnings.map((warn, i) => (
                  <div key={i} className="flex items-start gap-2 text-amber pl-6">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Line {warn.line}: {warn.message}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'abi' && (
          <div className="relative">
            {compileResult?.abi ? (
              <>
                <div className="absolute top-0 right-0">
                  <CopyButton text={JSON.stringify(compileResult.abi, null, 2)} />
                </div>
                <pre className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(compileResult.abi, null, 2)}
                </pre>
              </>
            ) : (
              <div className="text-muted-foreground/50 italic py-4 text-center">Compile first to see the ABI</div>
            )}
          </div>
        )}

        {activeTab === 'bytecode' && (
          <div className="relative">
            {compileResult?.bytecode ? (
              <>
                <div className="absolute top-0 right-0">
                  <CopyButton text={`0x${compileResult.bytecode}`} />
                </div>
                <pre className="text-muted-foreground leading-relaxed break-all">
                  0x{compileResult.bytecode}
                </pre>
              </>
            ) : (
              <div className="text-muted-foreground/50 italic py-4 text-center">Compile first to see the bytecode</div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-2">
            {isAuditing && (
              <div className="flex items-center gap-2 text-amber">
                <div className="h-3 w-3 rounded-full border-2 border-amber border-t-transparent animate-spin" />
                Analyzing with AI...
              </div>
            )}
            {!isAuditing && securityFindings.length === 0 && (
              <div className="text-muted-foreground/50 italic py-4 text-center">
                Click Audit to analyze for security vulnerabilities
              </div>
            )}
            {securityFindings.map((finding, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${severityBg(finding.severity)}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-xs font-semibold uppercase ${severityColor(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Line {finding.line}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{finding.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{finding.description}</p>
                <p className="text-[11px] text-indigo">Fix: {finding.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

