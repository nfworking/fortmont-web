export default function Page() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Dashboard overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Use the sidebar to open the LXC registry, server registry, users, and server settings pages.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
