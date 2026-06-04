import type { Metadata } from "next";
import { Geist, Geist_Mono, The_Girl_Next_Door } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import TransitionLayout from "@/components/transitionlayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Fortmont Webmail Creation",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <Toaster  />
        <TransitionLayout>
          <Providers session={null}>
            {children}
         
          </Providers>
        </TransitionLayout>
      </body>
    </html>
  );
}


