/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
'use client'

import { Card } from '@/components/ui/card'
import { useDropzone } from 'react-dropzone'
import React from 'react'
import { Presentation, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadFile } from '@/lib/firebase'

const Meetings = () => {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  
  const {getRootProps, getInputProps} = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.oog', '.m4a'],
    }, 
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
      setIsUploading(true)
      console.log(acceptedFiles)
      const file = acceptedFiles[0]
      const downloadUrl = await uploadFile(file as File, setProgress);
      setIsUploading(false)
    },
  });
  
  return (
    <Card className='col-span-2 flex flex-col items-center justify-center gap-4' {...getRootProps()}>
      <Presentation className={`h-10 w-10 ${isUploading ? 'animate-bounce' : ''}`} />
      <h3 className='mt-2 text-sm font-semibold text-gray-950'>
        Create a new meeting
      </h3>
      <p className='mt-1 text-center text-sm text-gray-500'>
        Analyse your meeting and get insights
        <br />
        Powered by AI
      </p>
      <div className='mt-6'>
        <Button disabled={isUploading} className='bg-primary text-white hover:bg-primary/90 cursor-pointer' >
          <Upload className="ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          {isUploading ? `Uploading ${progress}%` : 'Upload Meeting'}
          <input className='hidden' {...getInputProps()} />
        </Button>
      </div>
    </Card>
  )
}

export default Meetings