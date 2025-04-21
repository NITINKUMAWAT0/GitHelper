'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import useProject from '@/hooks/useProject'
import { api } from '@/trpc/react'
import React from 'react'
import AskQuestionCard from '../dashboard/ask-question-card'
import MDEditor from '@uiw/react-md-editor'
// import CodeReferences from '../dashboard/code-references'

const QA = () => {
  const { projectId } = useProject()
  const { data: questions } = api.project.getQuestion.useQuery({
    projectId: projectId
  })
  const [questionIndex, setQuestionIndex] = React.useState(0)
  const question = questions?.[questionIndex]
  return (
    <Sheet>
      <AskQuestionCard />
      <div className="h-4"></div>
      <div className="text-xl font-semibold">Asked Question</div>
      <div className="h-2"></div>
      <div className="flex flex-col gap-2">
        {questions?.map((question, index) => (
          <React.Fragment key={question.id}>
            <SheetTrigger onClick={() => setQuestionIndex(index)}>
              <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-border">
                <img src={question?.user.imageUrl ?? ""} alt="user img" className='rounded-full size-8' />

                <div className="text-left flex flex-col">
                  <div className='flex items-center gap-2'>
                    <p className='text-gray-700 line-clamp-1 text-lg font-medium'>
                      {question?.question}
                    </p>
                    <span className='text-xs text-gray-400 whitespace-nowrap'>
                      {question?.createdAt?.toLocaleDateString() ?? ''}
                    </span>
                  </div>
                  <p className='text-gray-500 line-clamp-1   text-sm'>
                    {question?.answer}
                  </p>
                </div>
              </div>
            </SheetTrigger>
          </React.Fragment>
        ))}
      </div>
      {
        question && (
          <SheetContent className="sm:max-w-[80vw] overflow-hidden flex flex-col h-full bg-gray-800">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle className='text-white font-semibold text-lg'>
                {question?.question}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto mt-4">
              <MDEditor.Markdown
                source={question?.answer}
                className="px-10 py-10"
              />
              {/* <CodeReferences filesReferences={question?.fileReference ?? [] as any} /> */}
            </div>
          </SheetContent>
        )
      }
    </Sheet >
  )
}

export default QA
