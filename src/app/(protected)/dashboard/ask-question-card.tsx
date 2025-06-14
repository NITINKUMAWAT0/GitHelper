/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import MDEditor from "@uiw/react-md-editor"
// import CodeReferences from './code-references'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import useRefetch from '@/hooks/use-refetch'

const AskQuestionCard = () => {
  const { project } = useProject()
  const [open, setOpen] = React.useState(false)
  const [question, setQuestion] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([])
  const [answer, setAnswer] = React.useState('')
  const saveAnswer = api.project.saveAnswer.useMutation()

  const onSubmit = async (e: React.FormEvent) => {
    setAnswer('')
    setFilesReferences([])
    e.preventDefault()
    if (!project?.id) return

    setLoading(true)
    setOpen(true)

    const { answer, filesReferences } = await askQuestion(question, project.id)
    setOpen(true)
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

  const handleSaveAnswer = () => {
    if (!project?.id) return;

    saveAnswer.mutate({
      projectId: project.id,
      question,
      answer,
      filesReferences: filesReferences, // Pass the object directly, not as JSON string
    }, {
      onSuccess: async () => {
        toast.success('Answer saved successfully!')
        await refetch();
        setOpen(false)
      },
      onError: (error) => {
        console.error('Save error:', error)
        toast.error('Failed to save answer')
      }
    })
  }

  const refetch = useRefetch();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className='flex items-center gap-2'>
              <DialogTitle className="flex items-center gap-2">
                <Image src={GithubLogo} alt="GitHub logo" width={40} height={40} />
                <span className="text-lg font-medium">GitHub Response</span>
              </DialogTitle>
              <Button
                disabled={saveAnswer.isPending}
                variant={'outline'}
                onClick={handleSaveAnswer}
              >
                Save Answer
              </Button>
            </div>
          </DialogHeader>

          <div className="border rounded-md mt-4 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-8 p-4">
                <div className="text-muted-foreground">Thinking...</div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <MDEditor.Markdown
                    source={answer}
                    className="max-h-100 overflow-y-auto p-4 mb-4 whitespace-pre-wrap"
                  />
                </div>
                {/* <CodeReferences filesReferences={filesReferences}/> */}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => setOpen(false)} type="button">
              Close
            </Button>
          </div>
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