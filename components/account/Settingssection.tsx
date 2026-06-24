import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Wraps a named section of the account settings page.
 * Renders an eyebrow tag, title, description, separator, then children.
 */
export function SettingsSection({
  tag,
  title,
  description,
  children,
  className,
}: {
  tag?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="space-y-1">
        {tag && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {tag}
          </p>
        )}
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Separator className="opacity-50" />
      {children}
    </section>
  );
}

/**
 * A single labelled read-only row (label left, value right).
 */
export function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "max-w-[60%] truncate text-right text-sm font-medium text-foreground",
          mono && "font-mono text-xs text-muted-foreground",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

/**
 * Divider used between detail rows.
 */
export function DetailDivider() {
  return <Separator className="opacity-30" />;
}