 /* eslint-disable @typescript-eslint/no-misused-promises */
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/useProject'
import { DialogTitle } from '@radix-ui/react-dialog'
import GithubLogo from '@/app/images/GithubLogo.png'
import Image from 'next/image'
import { askQuestion } from './actions'

const AskQuestionCard = () => {
  const { project } = useProject()
  const [open, setOpen] = React.useState(false)
  const [question, setQuestion] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([])
  const [answer, setAnswer] = React.useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!project?.id) return

    setLoading(true)
    setOpen(true)

    const { answer, filesReferences } = await askQuestion(question, project.id)
    setAnswer(answer)
    setFilesReferences(
      filesReferences.map((file) => ({
        fileName: file.fileName,
        sourceCode: file.sourceCode ?? '',
        summary: file.summary ?? '',
      }))
    )

    setLoading(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Image src={GithubLogo} alt="logo" width={40} height={40} />
            </DialogTitle>
          </DialogHeader>

          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {loading ? 'Thinking...' : answer}
          </div>

          <h1 className="mt-4 font-semibold text-base">File References</h1>
          <ul className="text-xs text-muted-foreground list-disc ml-4">
            {filesReferences.map((file) => (
              <li key={file.fileName}>{file.fileName}</li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file do I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            <div className="h-4" />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Asking...' : 'Ask Question!'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AskQuestionCard
