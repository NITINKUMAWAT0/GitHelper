/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { db } from "@/server/db";
import { headers } from "next/headers";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

export const getCommitHashes = async (
  _githubUrl: string,
): Promise<Response[]> => {
  const [owner, repo] = _githubUrl.split("/").slice(-2);
  if (!owner || !repo) {
    throw new Error("Invalid github url");
  }
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  const sortedCommits = data.sort(
    (a: any, b: any) =>
      new Date(b.commit.author.date).getTime() -
      new Date(a.commit.author.date).getTime(),
  ) as any[];

  return sortedCommits.slice(0, 5).map((commit: any) => ({
    commitHash: commit.sha as string,
    commitMessage: commit.commit.message,
    commitAuthorName: commit.commit.author?.name ?? "Unknown",
    commitAuthorAvatar: commit.author?.avatar_url ?? "",
    commitDate: commit.commit.author?.date ?? "",
  }));
};

export const pollCommits = async (projectId: string) => {
  try {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
    
    // Skip if no GitHub URL
    if (!githubUrl) {
      console.log(`Project ${projectId} has no GitHub URL configured. Skipping commit polling.`);
      return { count: 0 };
    }

    const commitHashes = await getCommitHashes(githubUrl);
    const unprocessedCommits = await filterUnprocessedCommits(
      projectId,
      commitHashes,
    );
    
    // If no unprocessed commits, return early
    if (unprocessedCommits.length === 0) {
      console.log(`No new commits to process for project ${projectId}`);
      return { count: 0 };
    }
    
    const summaryResponses = await Promise.allSettled(
      unprocessedCommits.map((commit) => {
        return summariseCommit(githubUrl, commit.commitHash);
      }),
    );

    const summaries = summaryResponses.map((response) => {
      if (response.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        return response.value as string;
      }
      return "";
    });

    const commits = await db.commit.createMany({
      data: summaries.map((summary, index) => {
        console.log(`processing commit ${index}`);
          
        return {
          projectId: projectId,
          commitHash: unprocessedCommits[index]!.commitHash,
          commitMessage: unprocessedCommits[index]!.commitMessage,
          commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
          commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
          commitDate: unprocessedCommits[index]!.commitDate,
          summary,
        };
      }),
    });

    return commits;
  } catch (error) {
    console.error(`Error polling commits for project ${projectId}:`, error);
    return { count: 0, error: error.message };
  }
};

async function summariseCommit(githubUrl: string, commitHash: string) {
  try {
    const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
    });
    return aiSummariseCommit(data) || "";
  } catch (error) {
    console.error(`Error summarising commit ${commitHash}:`, error);
    return "";
  }
}

async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true,
    },
  });
  
  // Project doesn't exist
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }
  
  // Project exists but has no GitHub URL
  if (!project.githubUrl) {
    console.warn(`Project ${projectId} has no GitHub URL configured`);
    return { project, githubUrl: null };
  }

  return { project, githubUrl: project.githubUrl };
}

async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: Response[],
) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
  });

  const unprocessedCommits = commitHashes.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommits) => processedCommits.commitHash === commit.commitHash,
      ),
  );

  return unprocessedCommits;
}

// Only run this if directly executed (not imported)
if (require.main === module) {
  pollCommits("cd10ffc7e4b9cd2c630da2ca88c57055bd5dc265")
    .then(result => console.log('Polling complete:', result))
    .catch(error => console.error('Polling failed:', error));
}