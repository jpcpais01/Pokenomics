import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border bg-page/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
            P
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">
            Pokenomics
          </span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <NavLinks className="flex items-center gap-6" />
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
