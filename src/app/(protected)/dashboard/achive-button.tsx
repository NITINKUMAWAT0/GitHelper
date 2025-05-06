/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

import { Button } from '@/components/ui/button';
import useRefetch from '@/hooks/use-refetch';
import useProject from '@/hooks/useProject';
import { api } from '@/trpc/react';
import React from 'react';
import { toast } from 'sonner';

const ArchiveButton = () => {
  const archivedProject = api.project.archiveProject.useMutation();
  const { projectId } = useProject()
  const refetch = useRefetch();

  const handleArchive = () => {
    const userConfirmed = window.confirm('Are you sure you want to archive this project?');
    if (!userConfirmed) return;

    archivedProject.mutate(
      { ProjectId: projectId },
      {
        onSuccess: () => {
          toast.success('Project archived successfully');
          void refetch();
        },
        onError: () => {
          toast.error('Error archiving project');
        },
      }
    );
  };

  return (
    <Button
      disabled={archivedProject.isPending}
      size="sm"
      variant="destructive"
      onClick={handleArchive}
    >
      Archive
    </Button>
  );
};

export default ArchiveButton;