import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Fingerprint, GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Input, Label } from "@/components/ui";

type Search = { next?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    next: typeof search["next"] === "string" ? search["next"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in with OnePass — ICS Events" },
      {
        name: "description",
        content: "OnePass is the shared ICS identity. Sign in once to reserve tickets, view 3D tickets and OVI receipts.",
      },
      { property: "og:title", content: "Sign in with OnePass — ICS Events" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const PERSONAS = [
  {
    key: "student",
    label: "Student",
    name: "Eldrex Dr. Bula",
    email: "eldrex@onepass.demo",
    detail: "Student ID 251056 · reserves tickets, sees own data only",
    icon: GraduationCap,
  },
  {
    key: "officer",
    label: "Officer",
    name: "Maria Cruz",
    email: "officer@onepass.demo",
    detail: "Creates events, marks payments PAID, runs check-in",
    icon: UserRound,
  },
  {
    key: "admin",
    label: "Admin",
    name: "Raul Reyes",
    email: "admin@onepass.demo",
    detail: "Full authority: approvals, refunds, all analytics",
    icon: ShieldCheck,
  },
] as const;

function safeNext(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [selected, setSelected] = useState<string>("student");
  const [password, setPassword] = useState("onepass123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persona = PERSONAS.find((p) => p.key === selected) ?? PERSONAS[0];

  async function signIn() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: persona.email,
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success(`Signed in as ${persona.name}`, { description: "Identity verified via OnePass" });
    await navigate({ to: safeNext(search.next) });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10">
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Fingerprint className="size-7 text-primary-foreground" />
        </div>
        <h1 className="mt-4 font-display text-3xl">OnePass</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One identity for every ICS tool. ICS Events never stores passwords or payment data.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 paper-edge">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Choose a demo identity
        </p>
        <div className="mt-3 space-y-2">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const active = p.key === selected;
            return (
              <button
                key={p.key}
                onClick={() => setSelected(p.key)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  active ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {p.label} — {p.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{p.detail}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{p.email}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="password">OnePass password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void signIn()}
          />
          <p className="text-xs text-muted-foreground">Demo password for all personas: onepass123</p>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <Button className="mt-4 w-full" size="lg" disabled={busy} onClick={() => void signIn()}>
          {busy ? "Verifying…" : "Continue with OnePass"}
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">This consent screen shares:</p>
        <p className="mt-1">• Your name and email — printed on tickets and receipts</p>
        <p>• Your student ID — for member pricing and members-only events</p>
        <p className="mt-2">No card data exists anywhere in ICS Events. Payments are cash, verified by officers.</p>
      </div>
    </div>
  );
}
