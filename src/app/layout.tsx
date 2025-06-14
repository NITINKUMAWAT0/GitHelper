// app/layout.tsx or app/layout.jsx

import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Git Helper",
  description: "get the assistant for your github repo...",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <ClerkProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors />
        </ClerkProvider>
      </body>
    </html>
  );
}
