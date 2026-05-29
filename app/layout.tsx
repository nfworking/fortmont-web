import type { Metadata } from "next";
import { Geist, Geist_Mono, The_Girl_Next_Door } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "../lib/auth";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fortmont API",
  description: "A API for managing your Fortmont server and its users.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
         <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           {children}
        </ThemeProvider>
        </TooltipProvider>
       </body>
     </html>
     </SessionProvider>
  );
}


