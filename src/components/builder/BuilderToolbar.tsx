'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Circle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRecipeBuilderStore } from '@/stores/recipeBuilderStore';
import { ShareRecipeButton } from '@/components/builder/ShareRecipeButton';
import { cn } from '@/lib/utils';

type BuilderToolbarProps = {
  recipeId: string;
  onSave: () => Promise<void>;
};

export function BuilderToolbar({ recipeId, onSave }: BuilderToolbarProps) {
  const recipeName = useRecipeBuilderStore((s) => s.recipeName);
  const isDirty = useRecipeBuilderStore((s) => s.isDirty);
  const isSaving = useRecipeBuilderStore((s) => s.isSaving);
  const lastSavedAt = useRecipeBuilderStore((s) => s.lastSavedAt);
  const setRecipeName = useRecipeBuilderStore((s) => s.setRecipeName);
  const steps = useRecipeBuilderStore((s) => s.steps);

  const hasSteps = steps.length > 0;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(recipeName);
  const [nameError, setNameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local name in sync when store initializes
  useEffect(() => {
    setNameValue(recipeName);
  }, [recipeName]);

  const handleNameClick = () => {
    setIsEditingName(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameError('Recipe name cannot be blank');
      return;
    }
    setNameError(null);
    setRecipeName(trimmed);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') {
      setNameValue(recipeName);
      setNameError(null);
      setIsEditingName(false);
    }
  };

  const saveLabel = () => {
    if (isSaving) return null;
    if (isDirty) return 'Unsaved changes';
    if (lastSavedAt) return 'Saved';
    return null;
  };

  return (
    <div className="flex h-12 items-center gap-3 border-b border-border bg-card px-4">
      {/* Back arrow */}
      <Button variant="ghost" size="icon" asChild className="shrink-0">
        <Link href="/dashboard" aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Inline recipe name editor */}
      <div className="flex min-w-0 flex-1 flex-col">
        {isEditingName ? (
          <Input
            ref={inputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            className={cn(
              'h-7 max-w-xs text-sm font-medium',
              nameError && 'border-destructive focus-visible:ring-destructive',
            )}
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="truncate text-left text-sm font-medium hover:text-muted-foreground transition-colors"
            title="Click to rename"
          >
            {recipeName || 'Untitled Recipe'}
          </button>
        )}
        {nameError && (
          <span className="text-xs text-destructive">{nameError}</span>
        )}
      </div>

      {/* Save status */}
      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        {isSaving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving…</span>
          </>
        ) : isDirty ? (
          <>
            <Circle className="h-2 w-2 fill-warning text-warning" />
            <span>{saveLabel()}</span>
          </>
        ) : lastSavedAt ? (
          <>
            <Check className="h-3 w-3 text-green-500" />
            <span>{saveLabel()}</span>
          </>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <ShareRecipeButton recipeId={recipeId} />
        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Span needed so Tooltip works on a disabled button */}
              <span>
                <Button size="sm" asChild={hasSteps} disabled={!hasSteps}>
                  {hasSteps ? (
                    <Link href={`/recipe/${recipeId}/run`}>Run Recipe</Link>
                  ) : (
                    <span>Run Recipe</span>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {!hasSteps && (
              <TooltipContent side="bottom">
                Add at least one step before running.
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
