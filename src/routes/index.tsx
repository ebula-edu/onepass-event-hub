import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, ShieldCheck, ReceiptText } from "lucide-react";
import { getPublishedEvents } from "@/lib/ics.functions";
import { EventCard } from "@/components/event-card";
import { Badge } from "@/components/ui";

const eventsQuery = queryOptions({
  queryKey: ["published-events"],
  queryFn: () => getPublishedEvents(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  head: () => ({
    meta: [
      { title: "ICS Events — reserve tickets with OnePass" },
      {
        name: "description",
        content:
          "Browse ICS campus events. Register free events instantly or reserve paid tickets and pay cash at the ICS office — 3D tickets and signed OVI receipts included.",
      },
      { property: "og:title", content: "ICS Events — reserve tickets with OnePass" },
      {
        property: "og:description",
        content: "Free and paid campus events with 3D materialized tickets, cash payments verified by officers, and HMAC-signed OVI receipts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
  { key: "member_only", label: "Members only" },
] as const;

function Index() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = events.filter((e) => filter === "all" || e.event_type === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* hero */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-border">
        <div className="cover-art cover-art--concert px-6 py-10 sm:px-10 sm:py-14">
          <div className="cover-art__grid" />
          <div className="relative max-w-2xl">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-primary-foreground backdrop-blur-sm">
              <Sparkles className="size-3" /> Second tool on OnePass
            </span>
            <h1 className="font-display text-4xl leading-tight text-primary-foreground sm:text-5xl">
              ICS Events — every ticket, materialized.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              Register for free events instantly, reserve paid tickets and pay cash at the ICS office.
              Your ticket is a 3D materialized stub; every payment gets a signed OVI receipt.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-primary-foreground/90">
              <span className="flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 backdrop-blur-sm">
                <ShieldCheck className="size-3.5" /> Identity by OnePass
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 backdrop-blur-sm">
                <ReceiptText className="size-3.5" /> Cash verified by officers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* filters */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                filter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
          <Badge variant="outline" className="ml-auto">
            {filtered.length} event{filtered.length === 1 ? "" : "s"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No events in this category yet.
          </p>
        )}
      </section>
    </div>
  );
}
