/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github';
import { Document } from '@langchain/core/documents';
import { generateEmbedding, summariseCode } from './gemini';
import { db } from '@/server/db';

const extractRepoName = (url: string) => {
  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1] : null;
};

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
  if (!githubToken || githubToken.trim() === '') {
    throw new Error("Valid GitHub token is required");
  }

  const repoName = extractRepoName(githubUrl);
  if (!repoName) throw new Error("Invalid GitHub URL");

  const loader = new GithubRepoLoader(repoName, {
    accessToken: githubToken, // If needed, try `Bearer ${githubToken}`
    branch: undefined,
    ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun-lockb'],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5,
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
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (!embeddingObj || !embeddingObj.embedding) {
        console.log(`Skipping index ${index} - missing embedding data`);
        return;
      }

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

        const embeddingString = JSON.stringify(embedding);

        await db.$executeRaw`
          UPDATE "SourceCodeEmbeddings"
          SET "summaryEmbedding" = ${embeddingString}::vector
          WHERE "id" = ${sourceCodeEmbedding.id}
        `;

        successCount++;
        console.log(`✅ Stored embedding for ${fileName}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing index ${index}:`, error);
      }
    })
  );

  console.log(`✅ Indexing complete. Success: ${successCount}, Errors: ${errorCount}`);
  return { successCount, errorCount };
};

const generateEmbeddings = async (docs: Document[]) => {
  console.log(`Generating embeddings for ${docs.length} documents`);

  return await Promise.all(
    docs.map(async (doc) => {
      try {
        const summary = await summariseCode(doc);
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
