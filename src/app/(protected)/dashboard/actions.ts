/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";

interface SourceCodeResult {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}

interface AskQuestionResponse {
  answer: string;
  filesReferences: Array<{
    sourceCode: string;
    summary: string;
    fileName: string;
    similarity: number;
  }>;
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export async function askQuestion(
  question: string,
  projectId: string
): Promise<AskQuestionResponse> {
  // Validate inputs
  if (!question?.trim()) {
    return {
      answer: "Please provide a valid question.",
      filesReferences: [],
    };
  }

  if (!projectId?.trim()) {
    return {
      answer: "Please provide a valid project ID.",
      filesReferences: [],
    };
  }

  try {
    console.log(`Starting question processing for project ${projectId}`);
    
    // Generate embedding for the question
    const queryVector = await generateEmbedding(question);
    if (!queryVector?.length) {
      console.error("Failed to generate embedding vector");
      return {
        answer: "Failed to process your question. Please try again.",
        filesReferences: [],
      };
    }

    // Debug: Check if project exists and has embeddings
    console.log(`Checking for embeddings in project ${projectId}`);
    const projectHasData = await db.sourceCodeEmbedding.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (!projectHasData) {
      console.log(`No embeddings found for project ${projectId}`);
      return {
        answer: "This project doesn't have any analyzed code yet.",
        filesReferences: [],
      };
    }

    // Try with progressively lower similarity thresholds
    const thresholds = [0.1, 0.05, 0.01];
    let results: SourceCodeResult[] = [];
    let usedThreshold = 0;

    for (const threshold of thresholds) {
      console.log(`Trying similarity threshold: ${threshold}`);
      results = await db.$queryRaw<SourceCodeResult[]>`
        SELECT 
          "fileName", 
          "sourceCode", 
          "summary", 
          1 - ("summaryEmbedding" <=> ${queryVector}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE "projectId" = ${projectId}
        AND 1 - ("summaryEmbedding" <=> ${queryVector}::vector) > ${threshold}
        ORDER BY similarity DESC
        LIMIT 10
      `;

      if (results.length > 0) {
        usedThreshold = threshold;
        console.log(`Found ${results.length} results at threshold ${threshold}`);
        break;
      }
    }

    // If no similar files found, return helpful message
    if (results.length === 0) {
      console.log("No similar files found, returning random samples");
      const randomFiles = await db.sourceCodeEmbedding.findMany({
        where: { projectId },
        take: 3,
        orderBy: { id: 'desc' }, // Simple way to get varied results
        select: { fileName: true }
      });

      if (randomFiles.length > 0) {
        return {
          answer: "I couldn't find exact matches, but here are some files from the project that might help:\n" +
            randomFiles.map(f => `- ${f.fileName}`).join('\n'),
          filesReferences: randomFiles.map(f => ({
            fileName: f.fileName,
            similarity: 0
          })),
        };
      }

      return {
        answer: "This project exists but I couldn't find any relevant code to answer your question.",
        filesReferences: [],
      };
    }

    // Generate AI response
    const context = results.map(doc => 
      `FILE: ${doc.fileName} (relevance: ${doc.similarity.toFixed(2)})\n` +
      `CODE:\n${doc.sourceCode}\n` +
      `SUMMARY: ${doc.summary || "No summary available"}\n` +
      `---\n`
    ).join("\n");

    const model = google("models/gemini-1.5-flash");
    const { textStream } =  streamText({
      model,
      prompt: `You're a code assistant. Answer this question based ONLY on below context:\n\n${context}\n\nQUESTION: ${question}\nANSWER:`
    });

    let fullAnswer = "";
    for await (const delta of textStream) {
      fullAnswer += delta;
    }

    return {
      answer: fullAnswer,
      filesReferences: results.map(doc => ({
        fileName: doc.fileName,
        similarity: doc.similarity
      })),
    };

  } catch (error) {
    console.error("Error in askQuestion:", error);
    return {
      answer: "An error occurred while processing your question. Please try again.",
      filesReferences: [],
    };
  }
}