'use client';

import { AlertTriangle, GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRecipeBuilderStore, hasBrokenVariableRef } from '@/stores/recipeBuilderStore';
import type { RecipeStep } from '@/types/recipe';
import { cn } from '@/lib/utils';

type StepListItemProps = {
  step: RecipeStep;
  isSelected: boolean;
};

export function StepListItem({ step, isSelected }: StepListItemProps) {
  const selectStep = useRecipeBuilderStore((s) => s.selectStep);
  const removeStep = useRecipeBuilderStore((s) => s.removeStep);
  const allSteps = useRecipeBuilderStore((s) => s.steps);

  const hasBrokenRef = hasBrokenVariableRef(step, allSteps);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors cursor-pointer',
        isSelected
          ? 'border-primary/50 bg-accent'
          : 'border-transparent hover:border-border hover:bg-accent/50',
        isDragging && 'opacity-50',
        hasBrokenRef && 'border-amber-500/40',
      )}
      onClick={() => selectStep(step.id)}
    >
      {/* Drag handle */}
      <button
        className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Step number */}
      <span className="shrink-0 text-xs font-mono text-muted-foreground w-5 text-center">
        {step.stepOrder + 1}
      </span>

      {/* Label */}
      <span className="flex-1 truncate font-medium">{step.label}</span>

      {/* Broken variable ref warning */}
      {hasBrokenRef && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-label="Broken variable reference" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-52">
              This step references an output from a step that now comes after it.
              Update the variable reference in the step configuration.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Type badge */}
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 text-xs px-1.5 py-0',
          step.stepType === 'deploy'
            ? 'border-blue-500/40 text-blue-400'
            : 'border-amber-500/40 text-amber-400',
        )}
      >
        {step.stepType === 'deploy' ? 'DEPLOY' : 'INTERACT'}
      </Badge>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          removeStep(step.id);
        }}
        aria-label="Remove step"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
