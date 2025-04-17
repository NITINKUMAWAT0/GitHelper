"use server";

import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function askQuestion(question: string, projectId: string) {
  const queryVector = await generateEmbedding(question);

  if (!queryVector || queryVector.length === 0) {
    return {
      answer: "Failed to generate embedding for the question.",
      filesReferences: [],
    };
  }

  const vectorStr = `[${queryVector.join(",")}]`;

  const result = await db.$queryRawUnsafe(`
    SELECT "fileName", "sourceCode", "summary",
      1 - ("summaryEmbedding" <=> '${vectorStr}') AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> '${vectorStr}') > 0.1
      AND "projectId" = '${projectId}'
    ORDER BY similarity DESC
    LIMIT 10
  `);

  if (!result || result.length === 0) {
    return {
      answer: "I'm sorry, but I don’t know the answer to that based on the context provided.",
      filesReferences: [],
    };
  }

  const context = result
    .map((doc) => `source: ${doc.fileName}\ncode: ${doc.sourceCode}\n\n`)
    .join("");

  const { textStream } = await streamText({
    model: google("models/gemini-1.5-flash"),
    prompt: `
You are an AI code assistant...
START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK

START QUESTION
${question}
END OF QUESTION
    `,
  });

  let fullAnswer = "";

  for await (const delta of textStream) {
    fullAnswer += delta;
  }

  return {
    answer: fullAnswer,
    filesReferences: result,
  };
}
