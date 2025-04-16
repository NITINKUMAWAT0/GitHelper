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
    console.log(`Starting indexing for GitHub repo: ${githubUrl}`);
    
    const docs = await loadGithubRepo(githubUrl, githubToken);
    console.log(`Loaded ${docs.length} files from repository`);
    
    const allEmbeddings = await generateEmbeddings(docs);
    console.log(`Generated embeddings for ${allEmbeddings.length} files`);
  
    let successCount = 0;
    let errorCount = 0;
    
    await Promise.allSettled(
      allEmbeddings.map(async (embeddingObj, index) => {
        console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);
        
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (!embeddingObj || !embeddingObj.embedding) {
          console.log(`Skipping index ${index} - missing embedding data`);
          return;
        }
        
        const { summary, embedding, sourceCode, fileName } = embeddingObj;
        
        try {
          // Create the record without embedding first
          const sourceCodeEmbedding = await db.sourceCodeEmbeddings.create({
            data: {
              summary,
              sourceCode,
              fileName,
              projectId,
            },
          });
          
          // Convert embedding array to proper format for PostgreSQL vector
          // PostgreSQL vector extension expects a string representation of the array
          const embeddingString = JSON.stringify(embedding);
          
          // Update with raw SQL using the correct conversion
          await db.$executeRaw`
            UPDATE "SourceCodeEmbeddings"
            SET "summaryEmbedding" = ${embeddingString}::vector
            WHERE "id" = ${sourceCodeEmbedding.id}
          `;
          
          successCount++;
          console.log(`Successfully stored embedding for ${fileName}`);
        } catch (error) {
          errorCount++;
          console.error(`Error processing index ${index}:`, error);
          // Print the full error details for debugging
          console.error(error);
        }
      })
    );
    
    console.log(`Indexing complete. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  };
  
  const generateEmbeddings = async (docs: Document[]) => {
    console.log(`Generating embeddings for ${docs.length} documents`);
    
    return await Promise.all(
      docs.map(async (doc) => {
        try {
          const summary = await summariseCode(doc);
          console.log(`Generated summary for ${doc.metadata.source}`);
          
          const embedding = await generateEmbedding(summary);
          
          return {
            summary,
            embedding,
            sourceCode: doc.pageContent,
            fileName: doc.metadata.source,
          };
        } catch (error) {
          console.error(`Error generating embedding for ${doc.metadata.source}:`, error);
          return null;
        }
      })
    );
  };