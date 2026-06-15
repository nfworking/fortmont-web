import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "../ui/button";
import KbaPostModal from "./NewKba";

export default async function KbaDashboardPage() {
  const articles = await prisma.kbArticle.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      createdAt: true,
    },
  });

  return (
    <div className="max-w-[860px] mx-auto px-6 py-10 pb-20">

      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <h1 className="text-xl font-medium tracking-tight text-foreground">
            Knowledge Base
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse articles, guides, and documentation for the Fortmont platform.
        </p>
        <KbaPostModal trigger={<Button variant="outline">New KBA</Button>} />
      </div>

      {/* Article count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Articles
        </p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </span>
      </div>

      {/* Article list */}
      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground border border-dashed border-border rounded-xl">
          <FileText className="w-8 h-8 opacity-30" />
          <p className="text-sm">No articles published yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {articles.map((article) => {
            const createdAt = new Date(article.createdAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const readTime = Math.max(1, Math.ceil(article.content.split(" ").length / 200));

            return (
              <Link
                key={article.id}
                href={`/ticketing/kba/${article.slug}`}
                className="group flex items-center justify-between gap-4 px-5 py-4 bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-500 transition-colors">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{createdAt}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-xs text-muted-foreground">{readTime} min read</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}