'use client'

import useProject from '@/hooks/useProject'
import React from 'react'

const Dashboard: React.FC = () => {
  const { projects = [], projectId } = useProject() || {};
  
  // Find the current project based on projectId
  const currentProject = projects.find(project => project.id === projectId);

  return (
    <div>
      <h1>{currentProject?.name ?? 'No project selected'}</h1>
    </div>
  )
}

export default Dashboard