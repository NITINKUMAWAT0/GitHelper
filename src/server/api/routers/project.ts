/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Project name is required"),
        githubUrl: z.string().url("Invalid GitHub URL"),
        githubToken: z.string().min(1, "GitHub token is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, githubUrl, githubToken } = input;

      const project = await ctx.db.project.create({
        data: {
          name,
          githubUrl,
          userToProject: {
            create: {
              userId: ctx.user.userId!,
            },
          },
        },
      });

      try {
        await indexGithubRepo(project.id, githubUrl, githubToken);
      } catch (e) {
        console.error("Indexing failed, but project was created:", e);
      }

      await pollCommits(project.id).catch(console.error);

      return project;
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: {
        userToProject: {
          some: {
            userId: ctx.user.userId!,
          },
        },
        deletedAt: null,
      },
    });
  }),

  getCommits: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      pollCommits(input.projectId).catch(console.error);
      return ctx.db.commit.findMany({
        where: { projectId: input.projectId },
      });
    }),
});
