import { create } from 'zustand';
import type { RecipeStep, RecipeWithSteps, StepParamConfig, StepType } from '@/types/recipe';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecipeBuilderState = {
  recipeId: string | null;
  recipeName: string;
  recipeDescription: string;
  isPublic: boolean;
  steps: RecipeStep[];
  selectedStepId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
};

type RecipeBuilderActions = {
  // Lifecycle
  initializeBuilder: (recipe: RecipeWithSteps) => void;

  // Meta fields
  setRecipeName: (name: string) => void;
  setRecipeDescription: (desc: string) => void;
  setIsPublic: (value: boolean) => void;

  // Step management
  addStep: (stepType: StepType) => void;
  removeStep: (stepId: string) => void;
  reorderSteps: (newOrder: string[]) => void;
  selectStep: (stepId: string | null) => void;
  updateStepField: <K extends keyof RecipeStep>(
    stepId: string,
    field: K,
    value: RecipeStep[K],
  ) => void;
  updateStepParam: (
    stepId: string,
    paramIndex: number,
    updates: Partial<StepParamConfig>,
  ) => void;

  // Save state
  setSaving: (value: boolean) => void;
  markSaved: () => void;

  // Computed getters
  getSelectedStep: () => RecipeStep | null;
  getStepsBeforeSelected: () => RecipeStep[];
};

export type RecipeBuilderStore = RecipeBuilderState & RecipeBuilderActions;

// ---------------------------------------------------------------------------
// Default empty step factory
// ---------------------------------------------------------------------------

function makeEmptyStep(stepType: StepType, stepOrder: number, recipeId: string): RecipeStep {
  return {
    id: `temp_${crypto.randomUUID()}`,
    recipeId,
    stepOrder,
    stepType,
    label: stepType === 'deploy' ? 'Deploy Contract' : 'Interact with Contract',
    contractName: null,
    abi: [],
    bytecode: null,
    targetAddress: null,
    functionName: null,
    constructorParams: [],
  };
}

// ---------------------------------------------------------------------------
// Recalculate step orders to be 0-indexed and contiguous
// ---------------------------------------------------------------------------

function reindexSteps(steps: RecipeStep[]): RecipeStep[] {
  return steps.map((step, index) => ({ ...step, stepOrder: index }));
}

// ---------------------------------------------------------------------------
// Check if a step has any broken variable references after reorder.
// A reference is broken when the referenced stepOrder >= the step's own stepOrder.
// ---------------------------------------------------------------------------

export function hasBrokenVariableRef(step: RecipeStep, allSteps: RecipeStep[]): boolean {
  const stepOrderSet = new Set(allSteps.map((s) => s.stepOrder));

  // Check constructor params
  for (const param of step.constructorParams) {
    if (!param.isVariable || !param.variableRef) continue;
    const match = /^step_(\d+)\./.exec(param.variableRef);
    if (!match) continue;
    const referencedOrder = Number.parseInt(match[1], 10);
    // Broken if referenced step no longer exists, or if its order >= this step's order
    if (!stepOrderSet.has(referencedOrder) || referencedOrder >= step.stepOrder) {
      return true;
    }
  }

  // Check targetAddress for interact steps
  if (step.stepType === 'interact' && step.targetAddress) {
    const match = /^\$\{step_(\d+)\./.exec(step.targetAddress);
    if (match) {
      const referencedOrder = Number.parseInt(match[1], 10);
      if (!stepOrderSet.has(referencedOrder) || referencedOrder >= step.stepOrder) {
        return true;
      }
    }
  }

  return false;
}

export const useRecipeBuilderStore = create<RecipeBuilderStore>((set, get) => ({
  // Initial state
  recipeId: null,
  recipeName: '',
  recipeDescription: '',
  isPublic: false,
  steps: [],
  selectedStepId: null,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  initializeBuilder: (recipe) => {
    set({
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeDescription: recipe.description ?? '',
      isPublic: recipe.isPublic,
      steps: [...recipe.steps].sort((a, b) => a.stepOrder - b.stepOrder),
      selectedStepId: null,
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
    });
  },

  // -------------------------------------------------------------------------
  // Meta fields
  // -------------------------------------------------------------------------

  setRecipeName: (name) => set({ recipeName: name, isDirty: true }),
  setRecipeDescription: (desc) => set({ recipeDescription: desc, isDirty: true }),
  setIsPublic: (value) => set({ isPublic: value, isDirty: true }),

  // -------------------------------------------------------------------------
  // Step management
  // -------------------------------------------------------------------------

  addStep: (stepType) => {
    const { steps, recipeId } = get();
    const newStep = makeEmptyStep(stepType, steps.length, recipeId ?? '');
    set({
      steps: [...steps, newStep],
      selectedStepId: newStep.id,
      isDirty: true,
    });
  },

  removeStep: (stepId) => {
    const { steps, selectedStepId } = get();
    const filtered = steps.filter((s) => s.id !== stepId);
    const reindexed = reindexSteps(filtered);
    set({
      steps: reindexed,
      selectedStepId: selectedStepId === stepId ? null : selectedStepId,
      isDirty: true,
    });
  },

  reorderSteps: (newOrder) => {
    const { steps } = get();
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const reordered = newOrder
      .map((id, index) => {
        const step = stepMap.get(id);
        if (!step) return null;
        return { ...step, stepOrder: index };
      })
      .filter((s): s is RecipeStep => s !== null);

    set({ steps: reordered, isDirty: true });
  },

  selectStep: (stepId) => set({ selectedStepId: stepId }),

  updateStepField: (stepId, field, value) => {
    const { steps } = get();
    const updated = steps.map((step) =>
      step.id === stepId ? { ...step, [field]: value } : step,
    );
    set({ steps: updated, isDirty: true });
  },

  updateStepParam: (stepId, paramIndex, updates) => {
    const { steps } = get();
    const updated = steps.map((step) => {
      if (step.id !== stepId) return step;
      const newParams = step.constructorParams.map((param, idx) =>
        idx === paramIndex ? { ...param, ...updates } : param,
      );
      return { ...step, constructorParams: newParams };
    });
    set({ steps: updated, isDirty: true });
  },

  // -------------------------------------------------------------------------
  // Save state
  // -------------------------------------------------------------------------

  setSaving: (value) => set({ isSaving: value }),

  markSaved: () =>
    set({ isDirty: false, isSaving: false, lastSavedAt: new Date() }),

  // -------------------------------------------------------------------------
  // Computed getters
  // -------------------------------------------------------------------------

  getSelectedStep: () => {
    const { steps, selectedStepId } = get();
    if (!selectedStepId) return null;
    return steps.find((s) => s.id === selectedStepId) ?? null;
  },

  getStepsBeforeSelected: () => {
    const { steps, selectedStepId } = get();
    if (!selectedStepId) return [];
    const selected = steps.find((s) => s.id === selectedStepId);
    if (!selected) return [];
    return steps.filter((s) => s.stepOrder < selected.stepOrder);
  },
}));
