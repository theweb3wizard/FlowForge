'use client';

import { useState } from 'react';
import { useUserTemplates, useDeleteUserTemplate } from '@/hooks/use-queries';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen, Trash2, FileCode, Loader2 } from 'lucide-react';
import { CreateTemplateModal } from '@/components/templates/CreateTemplateModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ContractTemplate } from '@/types/template';

export default function TemplatesPage() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading } = useUserTemplates();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteUserTemplate();
  
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleTemplateCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['templates', 'user', address] });
    setCreateModalOpen(false);
  };
  
  const handleDelete = (templateId: string) => {
    deleteTemplate(templateId, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Template deleted successfully');
        } else {
          toast.error('Failed to delete template', {
            description: result.error,
          });
        }
      },
      onError: (error) => {
        toast.error('Failed to delete template', {
          description: error.message,
        });
      },
    });
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to create and manage your private templates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Private Templates</h1>
            <p className="text-muted-foreground">
              Create, manage, and use your own custom smart contract templates.
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Template
          </Button>
        </div>

        {isLoading ? (
          <p>Loading your templates...</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 border-dashed border-2 rounded-lg">
            <h3 className="text-lg font-medium">You haven't created any templates yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click the button above to create your first private template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: ContractTemplate) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <FileCode className="h-6 w-6 text-primary" />
                      <CardTitle>{template.name}</CardTitle>
                    </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the template "{template.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created on {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTemplateCreated={handleTemplateCreated}
      />
    </>
  );
}
