'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRecipeBuilderStore } from '@/stores/recipeBuilderStore';
import { StepListItem } from '@/components/builder/StepListItem';
import { AddStepButton } from '@/components/builder/AddStepButton';
import { Layers } from 'lucide-react';

export function StepList() {
  const steps = useRecipeBuilderStore((s) => s.steps);
  const selectedStepId = useRecipeBuilderStore((s) => s.selectedStepId);
  const reorderSteps = useRecipeBuilderStore((s) => s.reorderSteps);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  const stepIds = sortedSteps.map((s) => s.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stepIds.indexOf(active.id as string);
    const newIndex = stepIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...stepIds];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    reorderSteps(newOrder);
  };

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      <div className="flex items-center gap-2 px-1">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Steps
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {steps.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {sortedSteps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
            <p>No steps yet.</p>
            <p className="text-xs">Add a step below to start building.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stepIds}
              strategy={verticalListSortingStrategy}
            >
              {sortedSteps.map((step) => (
                <StepListItem
                  key={step.id}
                  step={step}
                  isSelected={step.id === selectedStepId}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="shrink-0 pt-2 border-t border-border">
        <AddStepButton />
      </div>
    </div>
  );
}
