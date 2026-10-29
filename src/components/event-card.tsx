import { Link } from "@tanstack/react-router";
import { MapPin, Users } from "lucide-react";
import type { PublicEventSummary } from "@/lib/ics.functions";
import { eventDayLabel, eventTimeLabel, pesoShort } from "@/lib/format";
import { Badge, Button } from "@/components/ui";

function coverClass(category: string | null): string {
  const c = (category ?? "").toLowerCase();
  if (c.includes("assembly")) return "cover-art--assembly";
  if (c.includes("concert")) return "cover-art--concert";
  if (c.includes("workshop")) return "cover-art--workshop";
  return "cover-art--default";
}

function priceLabel(ev: PublicEventSummary): string {
  if (ev.event_type === "paid") return "From " + pesoShort(0) ; // replaced below
  return "";
}

export function EventCard({ ev }: { ev: PublicEventSummary }) {
  const isFree = ev.event_type === "free";
  const isMember = ev.event_type === "member_only";
  const pct = ev.capacity ? Math.min(100, Math.round((ev.reserved_count / ev.capacity) * 100)) : 0;

  return (
    <Link
      to="/event/$slug"
      params={{ slug: ev.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg paper-edge"
    >
      <div className={`cover-art ${coverClass(ev.category)} h-36 shrink-0 p-4`}>
        <div className="cover-art__grid" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-background/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
              {ev.category ?? "Event"}
            </span>
            <Badge variant={isFree ? "gold" : isMember ? "ink" : "default"}>
              {isFree ? "Free" : isMember ? "Members only" : "Paid"}
            </Badge>
          </div>
          <p className="font-display text-3xl leading-none text-primary-foreground/95">
            {new Date(ev.starts_at).getDate()}
            <span className="ml-1 align-top font-mono text-xs uppercase tracking-widest text-primary-foreground/70">
              {new Date(ev.starts_at).toLocaleDateString("en-PH", { month: "short" })}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-xl leading-tight text-card-foreground">{ev.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {eventDayLabel(ev.starts_at)} · {eventTimeLabel(ev.starts_at)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" /> {ev.location}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {ev.reserved_count} reserved
            {ev.capacity ? ` · ${ev.tickets_left} left` : ""}
          </span>
          <span className="font-mono text-sm font-semibold text-primary">
            {isFree ? "FREE" : isMember ? "Member pricing" : `from ₱${ev.paid_count > 0 ? "" : ""}`}
          </span>
        </div>
        {(ev.capacity ?? 0) > 0 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}

        <div className="mt-4">
          <Button variant={isFree ? "deep" : "default"} size="sm" className="w-full pointer-events-none">
            {isFree ? "Register with OnePass" : "Reserve ticket with OnePass"}
          </Button>
        </div>
      </div>
    </Link>
  );
}

export { priceLabel };
