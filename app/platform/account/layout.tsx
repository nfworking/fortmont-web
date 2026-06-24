
import { auth } from "@/lib/auth";
import {SessionProvider} from "next-auth/react"
import {ThemeToggle} from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const session = await auth();
  return (

      <div className="relative min-h-screen w-full">
            <SessionProvider session={session}>
   
       {children}

   
     
      </SessionProvider>
    </div>
    
  );
}