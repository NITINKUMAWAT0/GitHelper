/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc"; // adjust import paths as needed

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl:z.string(),
        githubToken:z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('hii', input);

      return { success: true };
    }),
});
