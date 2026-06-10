'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppNav } from '@/components/layout/AppNav';
import { AIPromptPanel } from '@/components/playground/AIPromptPanel';
import { CodeEditor } from '@/components/playground/CodeEditor';
import { CompileConsole } from '@/components/playground/CompileConsole';
import { InteractPanel } from '@/components/playground/InteractPanel';
import { DeployPanel } from '@/components/playground/DeployPanel';
import type { PlaygroundTab, CompileResult, SecurityFinding } from '@/types/playground';

const DEFAULT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Describe your contract above and click Generate
// Or pick a template from the left panel

contract HelloWorld {
    string public message = "Hello, Web3!";

    function setMessage(string memory _msg) public {
        message = _msg;
    }
}`;

export default function PlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>([]);
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('generate');
  const compileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleCompile = useCallback(async (source?: string) => {
    const src = source ?? code;
    if (!src.trim() || src.includes('Generating')) return;

    setIsCompiling(true);
    try {
      const result = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: src }),
      }).then((r) => r.json());

      setCompileResult(result);
    } catch {
      setCompileResult({
        success: false,
        errors: [{ line: 1, column: 1, message: 'Compilation request failed', severity: 'error' }],
        warnings: [],
      });
    } finally {
      setIsCompiling(false);
    }
  }, [code]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (compileTimerRef.current) clearTimeout(compileTimerRef.current);
    compileTimerRef.current = setTimeout(() => {
      handleCompile(newCode);
    }, 1200);
  }, [handleCompile]);

  const pendingCompileRef = useRef(false);

  // Auto-compile after generation completes
  useEffect(() => {
    if (!isGenerating && pendingCompileRef.current) {
      pendingCompileRef.current = false;
      handleCompile();
    }
  }, [isGenerating, handleCompile]);

  const handleAudit = useCallback(async () => {
    if (!code.trim() || code.includes('Generating')) return;

    setIsAuditing(true);
    setSecurityFindings([]);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Audit failed');
      }

      const data = await res.json();
      setSecurityFindings(data.findings ?? []);
    } catch (err: any) {
      setSecurityFindings([
        {
          severity: 'info',
          line: 1,
          title: 'Audit Unavailable',
          description: err?.message ?? 'Authentication required for AI security audit',
          recommendation: 'Sign in to use the AI auditor',
        },
      ]);
    } finally {
      setIsAuditing(false);
    }
  }, [code]);

  const handleDeployed = useCallback((address: string, chainId: number) => {
    // Store in localStorage for Interact panel
    window.localStorage.setItem('ff_last_deployed', address);
    window.localStorage.setItem('ff_chain_id', String(chainId));
  }, []);

  const tabs: { id: PlaygroundTab; label: string }[] = [
    { id: 'generate', label: 'Generate' },
    { id: 'interact', label: 'Interact' },
    { id: 'deploy', label: 'Deploy' },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden pt-14">
      <AppNav />

      <div className="flex items-center border-b border-border/50 px-4 gap-1 bg-card/30 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-indigo border-indigo'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'generate' && (
          <>
            <div className={`${showAiPanel ? 'flex' : 'hidden'} lg:flex w-full lg:w-72 absolute lg:relative z-10 lg:z-auto inset-0 lg:inset-auto border-r border-border/50 overflow-y-auto bg-card lg:bg-card/20 flex-shrink-0`}>
              <div className="relative w-full lg:w-72">
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="absolute top-2 right-2 lg:hidden text-muted-foreground hover:text-foreground p-1"
                  aria-label="Close AI panel"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <AIPromptPanel
                  onCodeGenerated={(generatedCode) => {
                    setCode(generatedCode);
                    setCompileResult(null);
                    setSecurityFindings([]);
                    pendingCompileRef.current = true;
                    setShowAiPanel(false);
                  }}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                />
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5 lg:hidden">
                <button
                  onClick={() => setShowAiPanel(true)}
                  className="text-xs px-2.5 py-1 rounded-md bg-indigo/80 hover:bg-indigo text-white transition-all"
                >
                  AI Panel
                </button>
                <span className="text-[10px] text-muted-foreground/40">Generate, audit & deploy</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  code={code}
                  onChange={handleCodeChange}
                  isReadOnly={isGenerating}
                  compileErrors={compileResult?.errors ?? []}
                />
              </div>
              <div className="h-48 lg:h-52 border-t border-border/50 flex-shrink-0">
                <CompileConsole
                  code={code}
                  compileResult={compileResult}
                  isCompiling={isCompiling}
                  onCompile={() => handleCompile()}
                  securityFindings={securityFindings}
                  onAudit={handleAudit}
                  isAuditing={isAuditing}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'interact' && (
          <InteractPanel />
        )}

        {activeTab === 'deploy' && (
          <div className="flex-1 overflow-y-auto">
            <DeployPanel
              code={code}
              abi={compileResult?.abi ?? []}
              bytecode={compileResult?.bytecode ?? null}
              onDeployed={handleDeployed}
            />
          </div>
        )}
      </div>
    </div>
  );
}

