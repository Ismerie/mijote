import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  period: string;
  summary?: string;
  // Flèches ‹ › vers le menu précédent et le suivant (#30), null quand il n'y en a pas.
  previousHref: string | null;
  nextHref: string | null;
};

function Arrow({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const className = "flex size-11 shrink-0 items-center justify-center";
  if (!href) {
    return (
      <span aria-hidden="true" className={cn(className, "text-muted-foreground/40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

// En-tête de l'accueil : « Menu en cours », sa période et ce qui est cuisiné (#28), avec les flèches (#30).
export function MenuHeader({ title, period, summary, previousHref, nextHref }: Props) {
  return (
    <header className="-mx-2 flex items-center gap-1">
      <Arrow href={previousHref} label="Menu précédent">
        <ChevronLeft aria-hidden="true" className="size-6" />
      </Arrow>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p>{period}</p>
        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
      </div>
      <Arrow href={nextHref} label="Menu suivant">
        <ChevronRight aria-hidden="true" className="size-6" />
      </Arrow>
    </header>
  );
}
