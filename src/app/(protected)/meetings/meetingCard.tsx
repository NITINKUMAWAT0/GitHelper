/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
'use client'

import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import { Card } from '@/components/ui/card'
import { useDropzone } from 'react-dropzone'
import React from 'react'
import { Presentation, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadFile } from '@/lib/firebase'
import { api } from "@/trpc/react"
import useProject from "@/hooks/useProject"
import { useRouter } from 'next/navigation';
import { toast } from "sonner"

const Meetings = () => {
  const { project } = useProject();
  const router = useRouter(); // Moved to top level
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const uploadMeeting = api.project.uploadMeetings.useMutation()

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'], // Fixed '.oog' to '.ogg'
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
      if (!project) return;

      setIsUploading(true);
      setProgress(0);

      try {
        const file = acceptedFiles[0];
        if (!file) {
          toast.error("No file selected");
          return;
        }

        const downloadUrl = await uploadFile(file, setProgress) as string;

        await uploadMeeting.mutateAsync({
          projectId: project.id,
          meetingUrl: downloadUrl,
          name: file.name,
        });

        toast.success("Meeting uploaded successfully");
        router.push(`/meetings`);
      } catch (error) {
        toast.error("Error uploading meeting");
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    },
  });

  return (
    <Card className='col-span-2 flex flex-col items-center justify-center gap-4 p-6' {...getRootProps()}>
      {!isUploading ? (
        <>
          <Presentation className='h-10 w-10 animate-bounce' />
          <h3 className='text-sm font-semibold text-gray-950'>
            Create a new meeting
          </h3>
          <p className='text-center text-sm text-gray-500'>
            Analyze your meeting and get insights
            <br />
            Powered by AI
          </p>
          <div className='mt-6'>
            <Button disabled={isUploading} className='bg-primary text-white hover:bg-primary/80'>
              <Upload className="mr-1.5 h-5 w-5" />
              Upload Meeting
              <input className='hidden' {...getInputProps()} />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="absolute h-full w-full">
            <CircularProgressbar
              value={progress}
              text={`${progress}%`}
              styles={buildStyles({
                pathColor: "#8C65F2",
                textColor: "#8C65F2",
              })}
            />
          </div>
          <p className="text-sm text-gray-500">Uploading your meeting...</p>
        </div>
      )}
    </Card>
  )
}

export default Meetings