import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, MapPin, Users } from "lucide-react";
import { getEventBySlug, reserveTicket, type PublicTicketType } from "@/lib/server/ics.functions";
import { supabase } from "@/integrations/supabase/client";
import { eventDayLabel, eventTimeLabel, peso } from "@/lib/format";
import { Badge, Button, Card } from "@/components/ui";

type EventData = NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>;

export const Route = createFileRoute("/event/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      queryOptionsFor(params.slug),
    );
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.event.title} — ICS Events` : "Event — ICS Events" },
      {
        name: "description",
        content: loaderData?.event.description ?? "Event on ICS Events — reserve with OnePass.",
      },
      { property: "og:title", content: loaderData ? `${loaderData.event.title} — ICS Events` : "Event — ICS Events" },
      { property: "og:description", content: loaderData?.event.description ?? "Reserve with OnePass." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventPage,
});

import { queryOptions } from "@tanstack/react-query";
function queryOptionsFor(slug: string) {
  return queryOptions({ queryKey: ["event", slug], queryFn: () => getEventBySlug(slug) });
}

function EventPage() {
  const { event, ticketTypes } = Route.useLoaderData() as EventData;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(ticketTypes[0]?.id ?? null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof reserveTicket>> | null>(null);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return null;
      return getMySession();
    },
    staleTime: 60_000,
  });

  const reserve = useMutation({
    mutationFn: (input: { slug: string; ticketTypeId: string }) => reserveTicket({ data: input }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["published-events"] });
      setResult(res);
      toast.success(res.issued ? "Ticket issued!" : "Ticket reserved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selected = ticketTypes.find((t) => t.id === selectedType) ?? null;
  const soldOut = event.capacity ? event.tickets_left <= 0 : false;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <div className="mt-8 overflow-hidden rounded-3xl border border-border">
        <div className="cover-art cover-art--default px-6 py-10 sm:px-10">
          <div className="cover-art__grid" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gold">{event.category ?? "Event"}</Badge>
              <Badge variant={event.event_type === "free" ? "success" : event.event_type === "member_only" ? "ink" : "default"}>
                {event.event_type === "free" ? "Free event" : event.event_type === "member_only" ? "Members only" : "Paid event"}
              </Badge>
            </div>
            <h1 className="mt-3 font-display text-4xl text-primary-foreground sm:text-5xl">{event.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-primary-foreground/85">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {eventDayLabel(event.starts_at)} · {eventTimeLabel(event.starts_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {event.location}
              </span>
              {event.capacity && (
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {event.reserved_count}/{event.capacity} reserved · {event.tickets_left} left
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="whitespace-pre-line leading-relaxed text-foreground/90">{event.description}</p>

          {result && (
            <Card className="mt-6 border-success/50 p-5">
              {result.issued ? (
                <>
                  <p className="flex items-center gap-2 font-semibold text-[var(--success)]">
                    <CheckCircle2 className="size-5" /> Ticket issued instantly — it's PAID (₱0.00 receipt generated).
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your 3D materialized ticket is waiting in{" "}
                    <Link to="/my-tickets" className="font-semibold text-primary underline-offset-2 hover:underline">
                      My Tickets
                    </Link>
                    . Receipt: <span className="font-mono">{result.receiptNumber}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 font-semibold text-gold-deep">
                    <CheckCircle2 className="size-5" /> Reservation created — pay cash at the ICS office.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Show reference <span className="font-mono font-semibold text-foreground">{result.reference}</span> at
                    the office. Once an officer marks your reservation PAID, your 3D ticket and OVI receipt appear in{" "}
                    <Link to="/my-tickets" className="font-semibold text-primary underline-offset-2 hover:underline">
                      My Tickets
                    </Link>
                    .
                  </p>
                </>
              )}
            </Card>
          )}
        </div>

        {/* reserve panel */}
        <Card className="h-fit p-5">
          <h2 className="font-display text-xl">Reserve with OnePass</h2>

          {ticketTypes.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No ticket types available.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {ticketTypes.map((t) => (
                <TicketTypeOption
                  key={t.id}
                  t={t}
                  selected={selectedType === t.id}
                  onSelect={() => setSelectedType(t.id)}
                  memberOnly={event.event_type === "member_only"}
                />
              ))}
            </div>
          )}

          {soldOut && <p className="mt-3 text-sm font-semibold text-destructive">This event is full.</p>}

          {!me ? (
            <Link to="/auth" search={{ next: `/event/${event.slug}` }} className="mt-4 block">
              <Button className="w-full" size="lg" disabled={soldOut || !selected}>
                Sign in with OnePass to continue
              </Button>
            </Link>
          ) : (
            <Button
              className="mt-4 w-full"
              size="lg"
              variant="deep"
              disabled={busyGuard(soldOut, !!selected, reserve.isPending, result !== null)}
              onClick={() => selected && reserve.mutate({ slug: event.slug, ticketTypeId: selected.id })}
            >
              {reserve.isPending ? "Confirming with OnePass…" : result ? "Reserved ✓" : `Confirm with OnePass${selected ? ` — ${priceLine(selected)}` : ""}`}
            </Button>
          )}

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {event.event_type === "paid"
              ? "Cash only: reserve now, pay at the ICS office. An officer marks your ticket PAID and issues it with an OVI receipt."
              : event.event_type === "member_only"
                ? "Members only: your OnePass student ID is verified during reservation."
                : "Free registration: ticket issued instantly with a ₱0.00 OVI receipt."}
          </p>
        </Card>
      </div>
    </div>
  );
}

function busyGuard(soldOut: boolean, hasType: boolean, pending: boolean, done: boolean): boolean {
  return soldOut || !hasType || pending || done;
}

function priceLine(t: PublicTicketType): string {
  return Number(t.price) === 0 ? "FREE" : peso(Number(t.price));
}

function TicketTypeOption({
  t,
  selected,
  onSelect,
  memberOnly,
}: {
  t: PublicTicketType;
  selected: boolean;
  onSelect: () => void;
  memberOnly: boolean;
}) {
  const scopes = t.scopes_required ?? [];
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors cursor-pointer ${
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
      }`}
    >
      <span>
        <span className="block text-sm font-semibold">{t.name}</span>
        {t.description && <span className="block text-xs text-muted-foreground">{t.description}</span>}
        {(memberOnly || scopes.includes("student_id")) && (
          <span className="mt-1 inline-block rounded bg-gold/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gold-deep">
            student ID verified
          </span>
        )}
      </span>
      <span className="font-mono text-sm font-semibold text-primary">{priceLine(t)}</span>
    </button>
  );
}
