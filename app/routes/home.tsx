import { Link } from "react-router";
import { ArrowRight, Code2, FileSearch, Globe, MessageSquare } from "lucide-react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Next AI — Your AI. Your Workspace." },
    {
      name: "description",
      content:
        "Ask questions, create content, analyze files, write code, and explore ideas with Next AI.",
    },
  ];
}

const FEATURES = [
  {
    Icon: MessageSquare,
    title: "AI Chat",
    description: "Have natural conversations with AI.",
  },
  {
    Icon: FileSearch,
    title: "File Analysis",
    description: "Upload documents and analyze them.",
  },
  {
    Icon: Code2,
    title: "Code Assistant",
    description: "Write, explain, and debug code.",
  },
  {
    Icon: Globe,
    title: "Web Research",
    description: "Explore information with AI.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-foreground">
            N
          </span>
          <span className="text-base font-semibold tracking-tight">Next AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/agent"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open app
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 text-center sm:pt-24">
        <div className="msg-in mx-auto mb-6 w-fit rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-brand align-middle" />
          Fast, Balanced & Reasoning models
        </div>
        <h1 className="msg-in text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
          Your AI.
          <br />
          <span className="text-muted-foreground">Your Workspace.</span>
        </h1>
        <p className="msg-in mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Ask questions, create content, analyze files, write code, and explore
          ideas with Next AI.
        </p>
        <div className="msg-in mt-9 flex justify-center gap-3">
          <Link
            to="/agent"
            className="group flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start Chatting
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Explore
          </a>
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-3xl border bg-surface p-3 text-left shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--foreground)_25%,transparent)]">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex justify-end">
              <div className="rounded-3xl bg-secondary px-5 py-3 text-[15px]">
                Explain what machine learning is.
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-brand-foreground">
                N
              </span>
              <div className="space-y-3 text-[15px] leading-relaxed">
                <p>
                  Machine learning is a branch of artificial intelligence where
                  systems{" "}
                  <strong>learn patterns from data</strong> instead of following
                  hand-written rules.
                </p>
                <div className="rounded-xl border bg-code p-4 font-mono text-[13px]">
                  <span className="text-brand">model</span>.fit(examples) →
                  predictions
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-full border bg-background px-5 py-3 text-sm text-muted-foreground">
              Ask Next AI anything...
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ArrowRight className="size-4 -rotate-90" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto grid max-w-6xl gap-3 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map(({ Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border p-6 transition-colors hover:bg-surface"
          >
            <Icon className="size-5 text-brand" />
            <h3 className="mt-4 font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © 2026 Next AI
      </footer>
    </div>
  );
}
