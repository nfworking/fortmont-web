import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fortmont Server Settings",
  description: "Dashboard for managing your Fortmont server and its users.",
};

export default function ServerSettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          FortmontAPI
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Server settings
        </h1> 
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          This page is wired up so the sidebar can navigate here. Add your server configuration controls here.
        </p>
      </section>
    </main>
  );
}