import { entries, type Entry } from "./entries";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-background/35 p-6 backdrop-blur-md transition-all duration-200 hover:border-white/[0.15] hover:bg-background/50">
      {/* subtle inner glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-1 ring-inset ring-white/10 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {entry.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {entry.description}
        </p>
      </div>

      <div className="mt-auto pt-2">
        <Link
          href={entry.href}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all duration-150 hover:border-white/[0.18] hover:bg-white/[0.10] hover:text-foreground"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
        </Link>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* same mesh-gradient background used on the GitHub dashboard */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(78,161,255,0.08),transparent)]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* page header */}
        <div className="mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
            Fortmont
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Integrations
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connected services and management consoles available in this
            workspace.
          </p>
        </div>

        {/* card grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}