'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AbiParseError, parseAbi } from '@/lib/abi/parser';
import type { ParsedAbi } from '@/types/abi';

type AbiUploaderProps = {
  onAbiParsed: (abi: ParsedAbi) => void;
  currentAbi?: ParsedAbi;
};

export function AbiUploader({ onAbiParsed, currentAbi }: AbiUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textValue, setTextValue] = useState(
    currentAbi && currentAbi.length > 0 ? JSON.stringify(currentAbi, null, 2) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const tryParse = (raw: string) => {
    setError(null);
    if (!raw.trim()) return;
    try {
      const abi = parseAbi(raw);
      onAbiParsed(abi);
    } catch (err) {
      if (err instanceof AbiParseError) {
        setError(err.message);
      } else {
        setError('Failed to parse ABI. Check the format and try again.');
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(e.target.value);
    tryParse(e.target.value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextValue(content);
      tryParse(content);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try pasting the ABI instead.');
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3 w-3" />
          Upload JSON
        </Button>
        <span className="text-xs text-muted-foreground">or paste below</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
        aria-label="Upload ABI JSON file"
      />

      <Textarea
        value={textValue}
        onChange={handleTextChange}
        placeholder='[{"type":"constructor","inputs":[...],"stateMutability":"nonpayable"}]'
        rows={5}
        className="font-mono text-xs"
        spellCheck={false}
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {!error && currentAbi && currentAbi.length > 0 && (
        <p className="text-xs text-green-500">
          ✓ ABI loaded — {currentAbi.length} entries
        </p>
      )}
    </div>
  );
}
