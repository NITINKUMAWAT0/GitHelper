'use client'

import React from 'react'
import useProject from '@/hooks/useProject'
import { api } from '@/trpc/react';
import MeetingCard from './meetingCard';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Meeting = () => {
    const { projectId } = useProject();
    const { data: meetings, isLoading } = api.project.getMeetings.useQuery({ projectId }, {
        refetchInterval: 4000
    })
    return (
        <>
            <MeetingCard />
            <div className="h-6"></div>
            <div className="text-xl font-semibold">
                {meetings && meetings.length === 0 && <div>No meetings Found </div>}
                {isLoading && <div>Loading...</div>}
                
                <ul className='divide-y divide-gray-200'>
                    {meetings?.map(meeting => (
                        <li key={meeting.id} className="flex justify-between items-center py-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Link href={`/meeting/${meeting.id}`} className='text-sm font-semibold'>
                                        {meeting.name}
                                        {meeting.status === 'PROCESSING' && (
                                            <Badge className='bg-primary text-white ml-2'>
                                                Processing...
                                            </Badge>
                                        )}
                                    </Link>
                                </div>
                                
                                <div className='flex items-center text-xs text-gray-500 gap-x-2'>
                                    <p className='whitespace-nowrap'>
                                        {meeting.createdAt.toLocaleDateString()}
                                    </p>
                                    <p className='truncate'>{meeting.issues.length} issues</p>
                                </div>
                            </div>
                            
                            <div className="flex-shrink-0 ml-4">
                                <Link href={`/meeting/${meeting.id}`}>
                                    <Button variant='outline' className='text-xs'>
                                        View meeting
                                    </Button>
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}

export default Meeting