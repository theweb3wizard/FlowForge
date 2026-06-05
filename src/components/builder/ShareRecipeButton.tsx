'use client';

import { useState } from 'react';
import { Check, Copy, Globe, Lock, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { togglePublicAction } from '@/lib/actions/recipeActions';
import { useRecipeBuilderStore } from '@/stores/recipeBuilderStore';

type ShareRecipeButtonProps = {
  recipeId: string;
};

export function ShareRecipeButton({ recipeId }: ShareRecipeButtonProps) {
  const isPublic = useRecipeBuilderStore((s) => s.isPublic);
  const setIsPublic = useRecipeBuilderStore((s) => s.setIsPublic);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
  const shareUrl = `${appUrl}/recipe/shared/${recipeId}`;

  const handleMakePublic = async () => {
    setIsLoading(true);
    const result = await togglePublicAction(recipeId, true);
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to share recipe.');
      return;
    }

    setIsPublic(true);
    toast.success('Recipe is now public.');
  };

  const handleMakePrivate = async () => {
    setIsLoading(true);
    const result = await togglePublicAction(recipeId, false);
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to update recipe.');
      return;
    }

    setIsPublic(false);
    setOpen(false);
    toast.success('Recipe is now private.');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {!isPublic ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Make this recipe public?</p>
              <p className="text-xs text-muted-foreground">
                Anyone with the link can view and copy this recipe.
              </p>
            </div>
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={handleMakePublic}
              disabled={isLoading}
            >
              <Globe className="h-3 w-3" />
              {isLoading ? 'Making public…' : 'Make Public'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Shareable link</p>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view and copy your recipe.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
              onClick={handleMakePrivate}
              disabled={isLoading}
            >
              <Lock className="h-3 w-3" />
              {isLoading ? 'Updating…' : 'Make Private'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
