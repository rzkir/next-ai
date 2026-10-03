import { NavLink, useLocation } from "react-router";
import {
  Bot,
  Code2,
  Search,
  Megaphone,
  Wallet,
  HeartPulse,
  Lightbulb,
  GraduationCap,
  Cpu,
  FlaskConical,
  Languages,
  Scale,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

export type SidebarItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  agent: Bot,
  programming: Code2,
  seo: Search,
  marketing: Megaphone,
  finance: Wallet,
  health: HeartPulse,
  trivia: Lightbulb,
  academia: GraduationCap,
  technology: Cpu,
  science: FlaskConical,
  translation: Languages,
  legal: Scale,
};

type Props = {
  items: SidebarItem[];
  homeHref?: string;
  openNavigationLabel?: string;
  closeNavigationLabel?: string;
  agentNavigationLabel?: string;
};

export function AgentSidebar({
  items,
  homeHref = "/agent",
  openNavigationLabel = "Open navigation",
  closeNavigationLabel = "Close navigation",
  agentNavigationLabel = "Agent navigation",
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, "") || "/";

  function isActive(href: string) {
    const normalized = href.replace(/\/$/, "") || "/";
    if (normalized === "/agent") return pathname === "/agent";
    return pathname === normalized || pathname.startsWith(`${normalized}/`);
  }

  return (
    <>
      <button
        type="button"
        className="agent-sidebar-toggle fixed top-3 left-4 z-50 flex size-10 items-center justify-center rounded-xl border border-border bg-background/95 text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-muted md:hidden"
        aria-label={mobileOpen ? closeNavigationLabel : openNavigationLabel}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <div
        className={cn(
          "agent-sidebar-backdrop fixed inset-0 z-40 bg-background/60 transition-opacity duration-200 md:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "agent-sidebar fixed inset-y-0 left-0 z-50 flex w-20 flex-col overflow-visible border-r border-border bg-background py-8 transition-transform duration-200 ease-out md:static md:translate-x-0 md:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="relative z-60 flex h-full min-h-0 flex-col items-center overflow-visible md:h-dvh">
          <NavLink
            to={homeHref}
            className="group mb-8 cursor-pointer"
            aria-label="Home"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground transition-transform group-hover:rotate-12">
              <span className="text-2xl font-bold text-background">R</span>
            </div>
          </NavLink>

          <nav
            className="flex min-h-0 w-full flex-1 overflow-visible"
            aria-label={agentNavigationLabel}
          >
            <div className="sidebar-nav-scroll flex min-h-0 w-full flex-1 flex-col items-center gap-6 overflow-y-auto overscroll-contain lg:gap-8">
              {items.map((item) => {
                const Icon = ICONS[item.icon] ?? Bot;
                const active = isActive(item.href);
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "inline-flex w-full justify-center transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-6" />
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
