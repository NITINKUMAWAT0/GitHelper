/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("Available models on ctx.db:", Object.keys(ctx.db));
      const { name, githubUrl, githubToken } = input;

      const project = await ctx.db.project.create({
        data: {
          name,
          githubUrl,
          userToProject: {
            create: {
              userId: ctx.user.userId!, // assuming userId is always defined after middleware
            },
          },
        },
      });
      await indexGithubRepo(project.id, input.githubUrl, input.githubToken);
      await pollCommits(project.id);
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
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      pollCommits(input.projectId).then().catch(console.error);
      return await ctx.db.commit.findMany({
        where: { projectId: input.projectId },
      });
    }),

  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesReferences: z.array(
          z.object({
            fileName: z.string(),
            sourceCode: z.string(),
            summary: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) {
        throw new Error("Database context is undefined");
      }

      if (!ctx.db.question) {
        throw new Error("Question model is not available on database context");
      }

      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          fileReference: input.filesReferences,
          projectId: input.projectId,
          question: input.question,
          userId: ctx.user.userId!,
        },
      });
    }),

  getQuestion: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  uploadMeetings: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.create({
        data: {
          meetingUrl: input.meetingUrl,
          projectId: input.projectId,
          name: input.name,
          status: "PROCESSING",
        },
      });
      return meeting;
    }),
  getMeetings: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.meeting.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          issues: true,
        },
      });
    }),
  deleteMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Step 1: Delete all issues linked to this meeting
      await ctx.db.issue.deleteMany({
        where: { meetingId: input.meetingId },
      });

      // Step 2: Now delete the meeting
      return await ctx.db.meeting.delete({
        where: { id: input.meetingId },
      });
    }),

  getMeetingById: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.meeting.findUnique({
        where: {
          id: input.meetingId,
        },
        include: {
          issues: true,
        },
      });
    }),

  archiveProject: protectedProcedure
    .input(z.object({ ProjectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: {
          id: input.ProjectId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }),

  getArchivedProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: {
        userToProject: {
          some: {
            userId: ctx.user.userId!,
          },
        },
        deletedAt: {
          not: null
        },
      },
      orderBy: {
        deletedAt: 'desc', 
      },
    });
  }),

  restoreProject: protectedProcedure
    .input(z.object({ ProjectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: {
          id: input.ProjectId,
        },
        data: {
          deletedAt: null,
        },
      });
    }),

  // Fixed deleteProject functionality to handle all related data
  deleteProject: protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    try {
      await ctx.db.$transaction(async (tx) => {
        // Step 1: Delete questions (includes fileReference JSON)
        await tx.question.deleteMany({
          where: { projectId: input.projectId },
        });

        // Step 2: Delete commits
        await tx.commit.deleteMany({
          where: { projectId: input.projectId },
        });

        // Step 3: Find meeting IDs for issue deletion
        const meetings = await tx.meeting.findMany({
          where: { projectId: input.projectId },
          select: { id: true },
        });

        const meetingIds = meetings.map((m) => m.id);
        if (meetingIds.length > 0) {
          await tx.issue.deleteMany({
            where: { meetingId: { in: meetingIds } },
          });
        }

        // Step 4: Delete meetings
        await tx.meeting.deleteMany({
          where: { projectId: input.projectId },
        });

        // Step 5: Delete source code embeddings
        await tx.sourceCodeEmbedding.deleteMany({
          where: { projectId: input.projectId },
        });

        // Step 6: Delete user-project associations
        await tx.userToProject.deleteMany({
          where: { projectId: input.projectId },
        });

        // Final Step: Delete the project
        await tx.project.delete({
          where: { id: input.projectId },
        });
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting project:", error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }),

  
  getTeamMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.userToProject.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
      });
    }),
});