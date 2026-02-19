import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("rialo_theme");
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  const applyTheme = (dark: boolean) => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  };

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("rialo_theme", next ? "dark" : "light");
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
