/* eslint-disable @next/next/no-img-element */
'use client';

import useProject from '@/hooks/useProject';
import { api } from '@/trpc/react';
import React from 'react';

const TeamMembers = () => {
  const { projectId } = useProject();
  const { data: members, isLoading } = api.project.getTeamMembers.useQuery({ projectId });

  if (isLoading) return <p>Loading team members...</p>;

  return (
    <div className="flex items-center gap-2">
      {members?.map((member) => (
        <img
          key={member.id}
          src={member.user.imageUrl ?? '/default-image.png'}
          alt={member.user.firstName ?? 'User'}
          height={30}
          width={30}
          className="rounded-full"
        />
      ))}
    </div>
  );
};

export default TeamMembers;
