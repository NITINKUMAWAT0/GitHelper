/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, githubUrl, githubToken } = input;

      const project = await ctx.db.project.create({
        data: {
          name,
          githubUrl,
          userToProject: {
            create: {
              userId: ctx.user.userId, // assuming userId is always defined after middleware
            },
          },
        },
      });

      return project;
    }),
    getProjects:protectedProcedure.query(async({ctx})=>{
      return ctx.db.project.findMany({
        where:{
          userToProject:{
            some:{
              userId:ctx.user.userId!
            }
          },
          deletedAt:null
        }
      })
    })
});
