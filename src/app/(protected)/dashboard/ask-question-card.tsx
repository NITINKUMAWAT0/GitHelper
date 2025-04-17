/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
// import useProject from '@/hooks/useProject'
import { DialogTitle } from '@radix-ui/react-dialog'
import GithubLogo from '@/app/images/GithubLogo.png'
import Image from 'next/image'

const AskQuestionCard = () => {
    // const {project} = useProject();
    const [open, setOpen] = React.useState(false);
    const [question, setQuestion] = React.useState('');

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setOpen(true);
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
        </DialogContent>
    </Dialog>
    <Card className='relative col-span-3'>
        <CardHeader>
            <CardTitle>
                Ask a question
            </CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={onSubmit}>
                <Textarea placeholder="Which file I edit to change the home page?" value={question} onChange={e=> setQuestion(e.target.value)}/>
                <div className="h-4"></div>
                <Button type="submit" className="w-full">
                    Ask Question!
                </Button>
                </form>
        </CardContent>
    </Card>
    </>
  )
}

export default AskQuestionCard
