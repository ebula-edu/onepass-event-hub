import { useState } from "react";
import { Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMySession } from "@/lib/server/ics.functions";
import { Button } from "@/components/ui";

export function SiteHeader() {
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return null;
      return getMySession();
    },
    staleTime: 60_000,
  });

  const isStaff = !!me && (me.roles.includes("officer") || me.roles.includes("admin"));

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate({ to: "/auth", replace: true });
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl text-primary-deep">ICS Events</span>
          <span className="hidden rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            onepass
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
            Events
          </Link>
          {me && (
            <Link to="/my-tickets" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
              My Tickets
            </Link>
          )}
          {isStaff && (
            <Link to="/organizer" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
              <ShieldCheck className="size-4" /> Organizer
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {me ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent cursor-pointer"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground">
                  {(me.name ?? me.email ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[140px] truncate sm:inline">{me.name ?? me.email}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl">
                  <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-semibold">{me.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{me.email}</p>
                    {me.studentId && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Student ID {me.studentId} · verified via OnePass
                      </p>
                    )}
                  </div>
                  <div className="md:hidden">
                    <Link to="/my-tickets" className="block rounded-lg px-2 py-2 text-sm hover:bg-accent" onClick={() => setMenuOpen(false)}>
                      <Ticket className="mr-2 inline size-4" /> My Tickets
                    </Link>
                    {isStaff && (
                      <Link to="/organizer" className="block rounded-lg px-2 py-2 text-sm hover:bg-accent" onClick={() => setMenuOpen(false)}>
                        <ShieldCheck className="mr-2 inline size-4" /> Organizer
                      </Link>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                    <LogOut className="size-4" /> Sign out
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm">
                <Ticket className="size-4" /> Sign in with OnePass
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
