import { useEffect, useState } from "react";

const THEMES = ["system", "light", "dark"];
export const THEME_ICONS = { system: "⚙", light: "☀", dark: "☾" };

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("ttw-theme") || "system");

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem("ttw-theme", theme);
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }, [theme]);

  function cycleTheme() {
    setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  }

  return { theme, cycleTheme };
}

