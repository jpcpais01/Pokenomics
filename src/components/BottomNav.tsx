"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Markets", icon: MarketsIcon },
  { href: "/about", label: "About", icon: InfoIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
                aria-current={active ? "page" : undefined}
              >
                <Icon active={active} />
                <span className={active ? "text-text-primary" : "text-text-muted"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MarketsIcon({ active }: { active: boolean }) {
  const c = active ? "var(--accent)" : "var(--text-muted)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19V13M10 19V9M16 19V5M22 19V11" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon({ active }: { active: boolean }) {
  const c = active ? "var(--accent)" : "var(--text-muted)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" />
      <path d="M12 11v5.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.15" fill={c} />
    </svg>
  );
}
