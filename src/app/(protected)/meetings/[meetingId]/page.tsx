// app/meeting/[meetingId]/page.tsx

import React from 'react'
import IssuesList from './issues-list'

interface Props {
  params: {
    meetingId: string
  }
}

const MeetingDetailsPage = ({ params }: Props) => {
  const { meetingId } = params

  return (
    <div>
      <IssuesList meetingId={meetingId}/>
    </div>
  )
}

export default MeetingDetailsPage
