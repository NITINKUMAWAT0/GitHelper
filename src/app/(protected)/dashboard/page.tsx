'use client'
import useProject from '@/hooks/useProject'
import React from 'react'
import { ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'
import CommitLogs from './commit-log';
import AskQuestionCard from './ask-question-card'
import MeetingsCard from '../meetings/meetingCard'
import ArchiveButton from './achive-button'
import InviteButton from './invite-button'
import TeamMembers from './team-members'

const Dashboard = () => {
  const { projects = [], projectId } = useProject() || {}
  const currentProject = projects.find(project => project.id === projectId)

  return (
    <div>
      {/* {projectId} */}
      {currentProject?.githubUrl && (
        <div className='flex items-center justify-between flex-wrap gap-y-4'>
          {/* github link */}
          <div className='flex items-center w-fit rounded-md bg-primary px-4 py-3'>
            <Github className='size-5 text-white' />
            <div className='ml-2'>
              <p className='text-sm font-medium text-white'>
                This project is linked to
                <Link href={currentProject.githubUrl} target="_blank" rel="noopener noreferrer" className='inline-flex items-center text-white/80 hover:underline'>
                  {currentProject.githubUrl}
                  <ExternalLink className='ml-1 size-4' />
                </Link>
              </p>
            </div>
          </div>

          <div className="h-4"></div>

          <div className='flex items-center gap-4'>
            <TeamMembers />
            <InviteButton />
            <ArchiveButton />
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-5'>
          <AskQuestionCard />
          <MeetingsCard />
        </div>
      </div>

      <div className='mt-8'></div>

      <CommitLogs />
    </div>
  )
}

export default Dashboard