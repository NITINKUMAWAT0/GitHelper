  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  import { db } from '@/server/db';
  import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github';
  import { generateEmbedding, summariseCode } from './gemini';
  import { Document } from 'langchain/document';

  export const loadGithubRepo = async (githubUrl: string, _githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
      accessToken: process.env.GITHUB_TOKEN ?? "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",
      branch: 'main',
      ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
      recursive: true,
      unknown: 'warn',
      maxConcurrency: 5
    })

    const docs = await loader.load()
    return docs
  }

  export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    const allEmbeddings = await generateEmbeddings(docs);
    await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
        console.log(`processing ${index} of ${allEmbeddings.length}`);
        if (!embedding) return;

        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            summary: embedding.summary,
            sourceCode: embedding.sourceCode,
            fileName: embedding.fileName,
            projectId: projectId
          }
        });
        
        // Then update the vector field with raw SQL
        await db.$executeRawUnsafe(
          `UPDATE "SourceCodeEmbedding"
           SET "summaryEmbedding" = $1::vector
           WHERE "id" = $2`,
          embedding.embedding,            // vector: number[]
          sourceCodeEmbedding.id          // uuid
        );
        
      
    }));
  };

  const generateEmbeddings = async (docs: Document<Record<string, any>>[]) => {
    return await Promise.all(docs.map(async (doc) => {
      const summary = await summariseCode({
        code: doc.pageContent,
        fileName: doc.metadata?.source ?? "unknown file",
      });
      const embedding = await generateEmbedding(summary);
      return {
        summary,
        embedding,
        sourceCode: doc.pageContent,
        fileName: doc.metadata?.source,
      };
    }));
  };
