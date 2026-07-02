'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect, useCallback } from 'react';
import type { CompileError } from '@/types/playground';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-indigo border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-mono">Loading editor...</span>
      </div>
    </div>
  ),
});

type CodeEditorProps = {
  code: string;
  onChange: (value: string) => void;
  isReadOnly?: boolean;
  compileErrors?: CompileError[];
};

export function CodeEditor({ code, onChange, isReadOnly, compileErrors }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }, []);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = (compileErrors ?? []).map((err) => ({
      severity: err.severity === 'error'
        ? monacoRef.current.MarkerSeverity.Error
        : monacoRef.current.MarkerSeverity.Warning,
      startLineNumber: err.line,
      startColumn: 1,
      endLineNumber: err.line,
      endColumn: 200,
      message: err.message,
    }));

    monacoRef.current.editor.setModelMarkers(model, 'solidity-compiler', markers);
  }, [compileErrors]);

  return (
    <MonacoEditor
      height="100%"
      language="solidity"
      value={code}
      onChange={(val) => onChange(val ?? '')}
      onMount={handleEditorDidMount}
      options={{
        readOnly: isReadOnly,
        fontSize: 13,
        fontFamily: 'JetBrains Mono, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'gutter',
        padding: { top: 16 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
      }}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme('flowforge-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'keyword', foreground: '6366F1', fontStyle: 'bold' },
            { token: 'type', foreground: '10B981' },
            { token: 'string', foreground: 'F59E0B' },
            { token: 'comment', foreground: '4B5563', fontStyle: 'italic' },
            { token: 'number', foreground: 'A78BFA' },
          ],
          colors: {
            'editor.background': '#0A0A0F',
            'editor.foreground': '#F8FAFC',
            'editorGutter.background': '#0A0A0F',
            'editor.lineHighlightBackground': '#12121A',
            'editorLineNumber.foreground': '#374151',
            'editorCursor.foreground': '#6366F1',
            'editor.selectionBackground': '#312E81',
            'editorBracketMatch.background': '#1E1B4B',
            'editorBracketMatch.border': '#6366F1',
          },
        });
      }}
      theme="flowforge-dark"
    />
  );
}

