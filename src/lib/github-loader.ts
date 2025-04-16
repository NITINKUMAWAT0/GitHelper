/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents';
import { generateEmbedding, summariseCode } from './gemini';
import { db } from '@/server/db';

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    // Remove logging the token for security reasons or just log that a token exists
    console.log("Loading GitHub repo with token:", githubToken ? "Token provided" : "No token");
    
    // Validate the token before using it
    if (!githubToken || githubToken.trim() === '') {
        throw new Error("Valid GitHub token is required");
    }
    
    // Format the URL properly
    const formattedUrl = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl;
    
    const loader = new GithubRepoLoader(formattedUrl, {
        accessToken: githubToken,
        // Use undefined to let the loader detect the default branch
        branch: undefined,
        ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun-lockb'],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5
    });
    
    try {
        const docs = await loader.load();
        console.log("Docs loaded:", docs.length);
        return docs;
    } catch (error) {
        console.error("Failed to load GitHub repo:", error);
        throw error;
    }
};

export const indexGithubRepo = async (
    projectId: string,
    githubUrl: string,
    githubToken?: string
  ) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    const allEmbeddings = await generateEmbeddings(docs);
  
    await Promise.allSettled(
      allEmbeddings.map(async (embeddingObj, index) => {
        console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);
  
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (!embeddingObj || !embeddingObj.embedding) return;
  
        const { summary, embedding, sourceCode, fileName } = embeddingObj;
  
        try {
          const sourceCodeEmbedding = await db.sourceCodeEmbeddings.create({
            data: {
              summary,
              sourceCode,
              fileName,
              projectId,
            },
          });
  
          await db.$executeRaw`
            UPDATE "SourceCodeEmbeddings"
            SET "summaryEmbedding" = ${embedding}::vector
            WHERE "id" = ${sourceCodeEmbedding.id}
          `;
        } catch (error) {
          console.error(`Error processing index ${index}:`, error);
        }
      })
    );
  };
  
  const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(
      docs.map(async (doc) => {
        const summary = await summariseCode(doc);
        const embedding = generateEmbedding(summary); // assumed renamed to avoid conflict
        return {
          summary,
          embedding,
          sourceCode: doc.pageContent,
          fileName: doc.metadata.source,
        };
      })
    );
  };
  