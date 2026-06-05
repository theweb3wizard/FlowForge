'use client';

import { useState } from 'react';
import { Code2, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRecipeBuilderStore } from '@/stores/recipeBuilderStore';

export function AddStepButton() {
  const addStep = useRecipeBuilderStore((s) => s.addStep);
  const [open, setOpen] = useState(false);

  const handleAdd = (type: 'deploy' | 'interact') => {
    addStep(type);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Step
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem
          onClick={() => handleAdd('deploy')}
          className="gap-2 cursor-pointer"
        >
          <Code2 className="h-4 w-4 text-blue-400" />
          Deploy Contract
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAdd('interact')}
          className="gap-2 cursor-pointer"
        >
          <Zap className="h-4 w-4 text-amber-400" />
          Interact with Contract
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
