import { Link } from "react-router";
import { History, Home, MoreHorizontal, Moon, Settings, Share, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { toast } from "~/lib/notifications";

type Props = {
  title: string;
  version?: string;
  showHistory?: boolean;
  openHistoryLabel?: string;
  settingsLabel?: string;
  backHomeLabel?: string;
  onToggleHistory?: () => void;
  className?: string;
};

export function AgentHeader({
  title,
  version = "v4",
  showHistory = false,
  openHistoryLabel = "Open conversation history",
  settingsLabel = "Settings",
  backHomeLabel = "Back home",
  onToggleHistory,
  className,
}: Props) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  function copyLink() {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied");
    });
  }

  return (
    <header
      className={cn(
        "agent-header relative z-10 flex min-h-14 shrink-0 items-center justify-between gap-3 px-3 py-2 sm:px-6 md:pl-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1 pl-11 md:pl-0">
        <h1 className="truncate text-sm font-medium tracking-tight sm:text-base">
          {title}
          <span className="ml-1.5 text-muted-foreground">{version}</span>
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {showHistory ? (
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            aria-label={openHistoryLabel}
            onClick={onToggleHistory}
          >
            <History className="size-4" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Share className="size-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="More"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="size-[18px]" />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 z-50 mt-1.5 min-w-40 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-md">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {dark ? "Light mode" : "Dark mode"}
              </button>
              <Link
                to="/agent/setting"
                aria-label={settingsLabel}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                <Settings className="size-4" />
                Settings
              </Link>
              <Link
                to="/agent"
                aria-label={backHomeLabel}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                <Home className="size-4" />
                Home
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
