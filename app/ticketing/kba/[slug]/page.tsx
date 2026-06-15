import { prisma } from "@/lib/prisma";
import { ArticleContent } from "@/components/ticketing/markdownredner";
import Link from "next/link";
import { Clock, Calendar, ChevronRight } from "lucide-react";

export default async function KbaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const kba = await prisma.kbArticle.findUnique({
    where: { slug },
  });

  if (!kba) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <p className="text-sm">Article not found</p>
        <Link href="/kb" className="text-xs underline underline-offset-4 hover:text-foreground transition-colors">
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  const readTime = Math.max(1, Math.ceil(kba.content.split(" ").length / 200));

  const updatedAt = new Date(kba.updatedAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-[720px] mx-auto px-6 py-10 pb-20">

      {/* Breadcrumb */}
   

      {/* Article header */}
      <header className="pb-6 border-b border-border mb-8">
        <h1 className="text-2xl font-medium leading-snug tracking-tight text-foreground mb-4">
          {kba.title}
        </h1>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Updated {updatedAt}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{readTime} min read</span>
          </div>
        </div>
      </header>

      {/* Article body */}
      <article className="
        prose prose-sm max-w-none
        text-foreground/90 leading-relaxed

        prose-headings:font-medium prose-headings:text-foreground prose-headings:tracking-tight

        prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
        prose-h2:pl-4 prose-h2:border-l-2 prose-h2:border-blue-500
        prose-h2:not-prose

        prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2

        prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:mb-4

        prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline

        prose-code:text-foreground prose-code:bg-muted prose-code:border prose-code:border-border
        prose-code:rounded prose-code:text-[13px] prose-code:px-1.5 prose-code:py-0.5
        prose-code:font-mono prose-code:before:content-none prose-code:after:content-none

        prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
        prose-pre:text-[13px] prose-pre:leading-relaxed prose-pre:my-4

        prose-blockquote:border-l-2 prose-blockquote:border-border
        prose-blockquote:pl-4 prose-blockquote:text-muted-foreground

        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
        prose-li:my-1

        prose-hr:border-border prose-hr:my-6
      ">
        <ArticleContent content={kba.content} />
      </article>
    </div>
  );
}