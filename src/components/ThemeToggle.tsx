"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  localStorage.setItem("pokenomics-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    // One-time read of an external system (localStorage) on mount to sync the
    // toggle icon with the theme the inline head script already applied to the DOM.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme((localStorage.getItem("pokenomics-theme") as Theme | null) ?? "system");
  }, []);

  function cycle() {
    const next: Theme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    setTheme(next);
    applyTheme(next);
  }

  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🌗";
  const label = theme === "dark" ? "Dark theme" : theme === "light" ? "Light theme" : "System theme";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${label}. Tap to change.`}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-base text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary active:scale-95"
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
