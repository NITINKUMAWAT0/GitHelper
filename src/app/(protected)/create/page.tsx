/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React from 'react'
import Image from 'next/image' // ✅ Add this line
import UndrawGithub from '../../images/Undraw_github.png'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/trpc/react'

interface FormInput {
    repoUrl: string
    projectName: string
    githubToken?: string
}

const Create = () => {
    const { register, handleSubmit, reset } = useForm<FormInput>()
    const createProject = api.project.createProject.useMutation()

    function onSubmit(data: FormInput) {
        window.alert(JSON.stringify(data, null, 2))
        return true
    }
    return (
        <div className='flex items-center gap-12 h-full justify-center'>
            <Image src={UndrawGithub} alt="img" width={300} height={300} placeholder="blur" />
            <div>
                <div>
                    <h1 className='font-semibold text-2xl'>
                        Link your Github Repository
                    </h1>
                    <p className='text-sm text-muted-foreground'>
                        Enter the URL of repository to link it to Git Helper
                    </p>
                </div>
                <div className="h-4">
                    <div>
                        <form action="" onSubmit={handleSubmit(onSubmit)}>
                            <Input required
                                {...register("projectName", { required: true })}
                                placeholder='Project Name'
                                className='mt-4'
                            />

                            <Input required
                                {...register("repoUrl", { required: true })}
                                placeholder='Repository URL'
                                className='mt-4'
                                type="url"
                            />

                            <Input required
                                {...register('githubToken', { required: true })}
                                placeholder='Github Token(Optional)'
                                className='mt-4'
                            />

                            <Button className='mt-4' type="submit">
                                Create Project
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Create
