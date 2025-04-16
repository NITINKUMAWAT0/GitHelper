/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents';
import { summariseCode } from './gemini';
import { db } from '@/server/db';

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken:githubToken ?? '',
        branch:'main',
        ignoreFiles:['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml','bun-lockb' ],
        recursive:true,
        unknown:'warn',
        maxConcurrency:5
    })
    const docs = await loader.load();

    return docs;
}

console.log(await loadGithubRepo("https://github.com/NITINKUMAWAT0/URL-SHORTENER-APPLICATION"));

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?:string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken)
    const allEmbeddings = await generateEmbeddings(docs);
    await Promise.allSettled(allEmbeddings.map(async (embedding: unknown, index: unknown)=> {
        console.log(`processing ${index} of ${allEmbeddings}`);
        if(!embedding) return
        
        const sourceCodeEmbedding = await db.sourceCodeEmbeddings.create({
            data:{
                summay:embedding.summary,
                sourceCode:embedding.sourceCode,
                fileName:embedding.fileName,
                projectId
            }
        })

        await db.$executeRaw`
        UPDATE "SourceCodeEmbeddings"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}
        `

    }))
}

const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(
      docs.map(async (doc) => {
        const summary = await summariseCode(doc);
        const embedding = await embedding(summary); // replace with actual embedding generator function
        return {
          summary,
          embedding,
          SourceCode: doc.pageContent,
          __filename: doc.metadata.source,
        };
      })
    );
  };
  