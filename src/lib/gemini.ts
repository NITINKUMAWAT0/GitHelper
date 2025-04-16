/* eslint-disable @typescript-eslint/prefer-optional-chain */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAi.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const aiSummariseCommit = async (diff: string) => {
  const response = await model.generateContent([
    `
You are an expert programmer, and you are trying to summarize a git diff.
Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\'\'\'

diff --git a/lib/index.js b/lib/index.js 
index aadf691..bfef603 100644 
--- a/lib/index.js 
+++ b/lib/index.js
\'\'\'

This means that lib/index.js was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified.
A line starting with \`+\` means it was added.
A line that starts with \`-\` means that line was deleted.
A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
It is not part of the diff.

EXAMPLE SUMMARY COMMENTS:

\'\'\'
*Raised the amount of returned recordings from 10 to 100 [packages/server/recordings_api.ts], [packages/server/constants.ts]
*Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
*Moved the octokit initialization to a separate file [src/octokit.ts], [src/index.ts]
*Added an OpenAI API for completions [packages/utils/apis/openai.ts]
*Lowered numeric tolerance for test files
\'\'\'

Most commits will have fewer comments than this example list.
The last comment does not include the file names,
because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments.

Please summarise the following diff file:${diff}`,
  ]);

  return response.response.text();
};

// Define your own Document interface or import it from the correct library
interface CustomDocument {
  pageContent?: string;
  metadata?: {
    source?: string;
    [key: string]: unknown;
  };
}

export async function summariseCode(doc: CustomDocument) {
  try {
    const sourceName = doc.metadata?.source ?? "unknown";
    console.log("getting summary for", sourceName);
    
    // Check if doc and pageContent exist before accessing
    if (!doc || !doc.pageContent) {
      throw new Error("Invalid document: missing pageContent");
    }
    
    const code = doc.pageContent.slice(0, 10000);
    
    const result = await model.generateContent([
      `You are an intelligent senior software engineer who specialises in onboarding junior software engineer onto projects`,
      `You are onboarding a junior software engineer and explaining to them the purpose of the ${sourceName} file
      Here is code:
      ---
      ${code}
      ---
       
      Give a summary no more than 150 words of the code above`,
    ]);
    
    return result.response.text();
  } catch (error: unknown) {
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating content:", errorMessage);
    throw new Error(`Failed to summarize code: ${errorMessage}`);
  }
}

export async function generateEmbedding(summary: string) {
  const model = genAi.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await model.embedContent(summary);
  const embedding = result.embedding
  return embedding.values
}

console.log(await generateEmbedding("hello world"));
