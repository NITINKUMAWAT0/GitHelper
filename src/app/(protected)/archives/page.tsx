'use client';

import { api } from '@/trpc/react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import useRefetch from '@/hooks/use-refetch';

interface Project {
  id: string;
  name: string;
  deletedAt: Date | string | null;
}

const ArchivedProjects = () => {
  const archivedProjects = api.project.getArchivedProjects.useQuery();
  const restoreProject = api.project.restoreProject.useMutation();
  const refetch = useRefetch();
  const utils = api.useContext();

  const handleRestore = (projectId: string) => {
    restoreProject.mutate(
      { ProjectId: projectId },
      {
        onSuccess: () => {
          toast.success('Project restored successfully');
          void refetch();
          void utils.project.getArchivedProjects.invalidate();
          void utils.project.getProjects.invalidate();
        },
        onError: () => {
          toast.error('Error restoring project');
        },
      }
    );
  };

  if (archivedProjects.isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
        Loading archived projects...
      </div>
    );
  }

  if (archivedProjects.error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-lg">
        Error loading archived projects
      </div>
    );
  }

  if (!archivedProjects.data || archivedProjects.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-muted-foreground text-xl font-semibold">
        No archived projects
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Archived Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {archivedProjects.data.map((project: Project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <div className="text-sm text-gray-500">
                Archived on: {project.deletedAt ? new Date(project.deletedAt).toLocaleDateString() : 'Unknown date'}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleRestore(project.id)}
                disabled={restoreProject.isPending}
              >
                Restore Project
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ArchivedProjects;
