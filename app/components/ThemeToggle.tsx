"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // null = mount хийгдээгүй (SSR-тэй зөрөхөөс сэргийлнэ)
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Mount-gate: DOM-оос одоогийн theme-ийг унших нь зөвхөн client дээр боломжтой
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !(dark ?? true);
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label="Өнгөний горим солих"
      title="Өнгөний горим солих"
      className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all flex items-center justify-center text-[14px]"
    >
      {dark === null ? "◐" : dark ? "☀️" : "🌙"}
    </button>
  );
}
