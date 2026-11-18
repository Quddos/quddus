"use client";

import { Moon, Sun } from "lucide-react";

export const THEME_KEY = "career-theme";

// Flips the career portal between light and dark. The current theme lives on
// #career-root (set before paint by ThemeScript), so this holds no React state
// and never disagrees with the server-rendered markup; which icon shows is
// decided in CSS from the same attribute.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const flip = () => {
    const root = document.getElementById("career-root");
    const next = root?.getAttribute("data-theme") === "light" ? "dark" : "light";
    root?.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode: the choice just won't be remembered.
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label="Switch between the light and dark theme"
      className={`grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition hover:border-line-strong hover:text-fg ${className}`}
    >
      <Sun className="theme-when-dark h-4 w-4" />
      <Moon className="theme-when-light h-4 w-4" />
    </button>
  );
}
