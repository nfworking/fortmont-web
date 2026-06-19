// app/(dashboard)/github/page.tsx
// GitHub account overview dashboard — fetches live data via /api/github/proxy

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  GitCommit, GitFork, Star, Users, Calendar, BookOpen,
  Code2, RefreshCw, AlertCircle, CheckCircle2, Loader2,
  ExternalLink, GitBranch, Lock, GitMerge,
  AlertTriangle,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  total_private_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  fork: boolean;
  pushed_at: string;
  default_branch: string;
}

interface CommitDay {
  date: string;
  label: string;
  commits: number;
}

interface LangStat {
  name: string;
  count: number;
  pct: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  "C#": "#178600", Java: "#b07219", Go: "#00ADD8", Rust: "#dea584",
  Ruby: "#701516", PHP: "#4F5D95", CSS: "#563d7c", HTML: "#e34c26",
  Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89e051",
  Vue: "#41b883", Dart: "#00B4AB", "C++": "#f34b7d", C: "#555555",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function proxyFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api/github/proxy/${path}`);
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  return res.json();
}

function langColor(lang: string | null) {
  return lang ? (LANG_COLORS[lang] ?? "#6b7280") : "#6b7280";
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/35 backdrop-blur-md p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-2xl font-medium text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/40 bg-background/35 backdrop-blur-md p-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-7 w-14 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GitHubDashboardPage() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [commitData, setCommitData] = useState<CommitDay[]>([]);
  const [langStats, setLangStats] = useState<LangStat[]>([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [totalForks, setTotalForks] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ghUser, ghRepos] = await Promise.all([
        proxyFetch<GitHubUser>("user"),
        proxyFetch<GitHubRepo[]>("user/repos?per_page=100&sort=pushed&affiliation=owner"),
      ]);

      setUser(ghUser);
      setTotalStars(ghRepos.reduce((a, r) => a + r.stargazers_count, 0));
      setTotalForks(ghRepos.reduce((a, r) => a + r.forks_count, 0));

      // Sort by stars for display
      const sorted = [...ghRepos].sort((a, b) => b.stargazers_count - a.stargazers_count);
      setRepos(sorted);

      // Language stats
      const langMap: Record<string, number> = {};
      ghRepos.forEach((r) => { if (r.language) langMap[r.language] = (langMap[r.language] ?? 0) + 1; });
      const total = Object.values(langMap).reduce((a, b) => a + b, 0);
      const langs = Object.entries(langMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));
      setLangStats(langs);

      // Commit history — last 30 days across top 10 repos
      const now = new Date();
      const days: CommitDay[] = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (29 - i));
        return {
          date: d.toISOString().split("T")[0],
          label: d.toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
          commits: 0,
        };
      });

      const dateIndex = Object.fromEntries(days.map((d, i) => [d.date, i]));
      const since = new Date(now);
      since.setDate(since.getDate() - 30);

      let count = 0;
      await Promise.all(
        ghRepos.slice(0, 10).map(async (r) => {
          try {
            const commits = await proxyFetch<{ commit: { author: { date: string } } }[]>(
              `repos/${ghUser.login}/${r.name}/commits?since=${since.toISOString()}&per_page=100`
            );
            if (!Array.isArray(commits)) return;
            commits.forEach((c) => {
              const day = c.commit.author.date.split("T")[0];
              const idx = dateIndex[day];
              if (idx !== undefined) { days[idx].commits++; count++; }
            });
          } catch (_) {}
        })
      );

      setTotalCommits(count);
      setCommitData([...days]);

      // Streak calculation
      let s = 0;
      for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].commits > 0) s++;
        else break;
      }
      setStreak(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load GitHub data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const memberYear = user ? new Date(user.created_at).getFullYear() : null;
  const memberAge = memberYear ? new Date().getFullYear() - memberYear : null;

  return (
    <div className="min-h-screen p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {loading ? (
            <Skeleton className="h-14 w-14 rounded-full" />
          ) : user ? (
            <img
              src={user.avatar_url}
              alt={user.login}
              className="h-14 w-14 rounded-full border border-border/40"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Code2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            {loading ? (
              <>
                <Skeleton className="h-6 w-36 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : user ? (
              <>
                <h1 className="text-xl font-medium text-foreground">{user.name || user.login}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground">@{user.login}</span>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {user.bio && <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{user.bio}</p>}
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!loading && !error && (
            <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </Badge>
          )}
          {error && (
            <Badge variant="outline" className="gap-1 text-destructive border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-3 w-3" /> Error
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5 bg-background/35 backdrop-blur-md">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="bg-background/35 backdrop-blur-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : user ? (
          <>
            <StatCard icon={BookOpen} label="Repos" value={(user.public_repos + (user.total_private_repos ?? 0)).toLocaleString()} sub={`${user.public_repos} public`} />
            <StatCard icon={Star} label="Stars earned" value={totalStars.toLocaleString()} sub="across all repos" />
            <StatCard icon={GitFork} label="Forks" value={totalForks.toLocaleString()} sub="on your repos" />
            <StatCard icon={GitCommit} label="Commits" value={totalCommits.toLocaleString()} sub="last 30 days" />
            <StatCard icon={AlertTriangle} label="Issues" value={totalIssues.toLocaleString()} sub="open on your repos" />
            <StatCard icon={Calendar} label="Member since" value={memberYear ?? "—"} sub={memberAge ? `${memberAge} year${memberAge !== 1 ? "s" : ""} on GitHub` : undefined} />
          </>
        ) : null}
      </div>

      {/* Commit Chart + Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Commit Chart */}
        <Card className="lg:col-span-2 bg-background/35 backdrop-blur-md border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-muted-foreground" />
                Commit activity — last 30 days
              </CardTitle>
              <div className="flex items-center gap-3">
                {!loading && (
                  <span className="text-2xl font-medium text-foreground">
                    {totalCommits.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">commits</span>
                  </span>
                )}
                {streak > 0 && (
                  <Badge variant="secondary" className="text-xs">{streak}d streak</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={commitData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "white" }}
                    interval={4}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 }}
                    labelStyle={{ color: "white", marginBottom: 2 }}
                    formatter={(value) => [`${value} commits`, ""]}
                    cursor={{ fill: "rgba(255,255,255,0.0)" }}
                  />
                  <Bar dataKey="commits" radius={[3, 3, 0, 0]}>
                    {commitData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.commits > 0 ? "rgba(39, 181, 245, 0.8)" : "rgba(39, 181, 245, 0.8)"}
                        fillOpacity={entry.commits > 0 ? 0.8 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card className="bg-background/35 backdrop-blur-md border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              Top languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2.5">
                {langStats.map((lang) => (
                  <div key={lang.name} className="flex items-center gap-2.5">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: langColor(lang.name) }}
                    />
                    <span className="text-xs text-foreground w-24 truncate">{lang.name}</span>
                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${lang.pct}%`, background: langColor(lang.name) }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{lang.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Repos Table */}
      <Card className="bg-background/35 backdrop-blur-md border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              Top repositories
            </CardTitle>
            <span className="text-xs text-muted-foreground">sorted by stars</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 pb-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div><Skeleton className="h-4 w-40 mb-1.5" /><Skeleton className="h-3 w-64" /></div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {repos.slice(0, 10).map((repo) => (
                <div key={repo.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {repo.name}
                      </a>
                      {repo.private && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> private
                        </Badge>
                      )}
                      {repo.fork && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                          <GitMerge className="h-2.5 w-2.5" /> fork
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-sm">
                      {repo.description || "No description"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: langColor(repo.language) }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-2.5 w-2.5" />
                        {repo.default_branch}
                      </span>
                      <span>Updated {relativeDate(repo.pushed_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5" />
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GitFork className="h-3.5 w-3.5" />
                      {repo.forks_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}