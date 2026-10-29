import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, ReceiptText } from "lucide-react";
import { getMyTickets, type MyTicketRow } from "@/lib/server/ics.functions";
import { Ticket3D } from "@/components/ticket-3d";
import { ReservationCard } from "@/components/reservation-card";
import { Badge, Card } from "@/components/ui";
import { buildIcsFile, eventDayLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/my-tickets")({
  loader: () => getMyTickets(),
  head: () => ({
    meta: [
      { title: "My Tickets — ICS Events" },
      {
        name: "description",
        content: "Your 3D materialized tickets, pending cash reservations and signed OVI receipts.",
      },
      { property: "og:title", content: "My Tickets — ICS Events" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyTickets,
});

function downloadIcs(t: MyTicketRow) {
  if (!t.event) return;
  const ics = buildIcsFile({
    title: t.event.title,
    location: t.event.location ?? "",
    startsAt: t.event.starts_at,
    endsAt: t.event.ends_at,
  });
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${t.ticket_code}.ics`;
  a.click();
}

function TicketActions({ t }: { t: MyTicketRow }) {
  const receipt = t.receipts?.[0];
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
      {receipt && (
        <Link to="/receipts/$receiptNumber" params={{ receiptNumber: receipt.receipt_number }}>
          <Badge variant="gold" className="gap-1">
            <ReceiptText className="size-3" /> View OVI receipt
          </Badge>
        </Link>
      )}
      <button
        onClick={() => downloadIcs(t)}
        className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-accent cursor-pointer"
      >
        <CalendarPlus className="size-3" /> Add to calendar
      </button>
    </div>
  );
}

function MyTickets() {
  const tickets = Route.useLoaderData() as MyTicketRow[];

  const paid = tickets.filter((t) => t.payment_status === "paid" && t.status === "active");
  const pending = tickets.filter((t) => t.payment_status === "unpaid" && t.status === "active");
  const used = tickets.filter((t) => t.status === "used");
  const cancelled = tickets.filter((t) => t.status === "cancelled");

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <div className="mt-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">My Tickets</h1>
          <p className="text-sm text-muted-foreground">3D materialized stubs — tap to flip, QR on the back.</p>
        </div>
      </div>

      {tickets.length === 0 && (
        <Card className="mt-8 p-10 text-center">
          <p className="font-display text-xl">No tickets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse <Link to="/" className="font-semibold text-primary underline-offset-2 hover:underline">ICS Events</Link> and reserve with OnePass.
          </p>
        </Card>
      )}

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Pending payment
          </h2>
          <div className="mt-3 space-y-4">
            {pending.map((t) => (
              <ReservationCard
                key={t.id}
                reference={t.ticket_code.replace("TKT-", "RSV-")}
                ticketCode={t.ticket_code}
                eventTitle={t.event?.title ?? "Event"}
                eventDate={t.event?.starts_at ?? t.created_at}
                location={t.event?.location ?? ""}
                typeName={t.ticket_type?.name ?? "Ticket"}
                amount={Number(t.ticket_type?.price ?? 0)}
              />
            ))}
          </div>
        </section>
      )}

      {paid.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Upcoming
          </h2>
          <div className="mt-3 grid gap-8 sm:grid-cols-2">
            {paid.map((t) => (
              <div key={t.id} className="flex flex-col items-center">
                <Ticket3D
                  ticketCode={t.ticket_code}
                  qrSignature={t.qr_signature}
                  eventTitle={t.event?.title ?? "Event"}
                  location={t.event?.location ?? ""}
                  startsAt={t.event?.starts_at ?? t.created_at}
                  holderName=""
                  seat={t.seat}
                  typeName={t.ticket_type?.name ?? null}
                  paymentStatus={t.payment_status}
                />
                <TicketActions t={t} />
              </div>
            ))}
          </div>
        </section>
      )}

      {used.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Past — checked in</h2>
          <div className="mt-3 grid gap-8 sm:grid-cols-2">
            {used.map((t) => (
              <div key={t.id} className="flex flex-col items-center opacity-75">
                <Ticket3D
                  compact
                  ticketCode={t.ticket_code}
                  qrSignature={t.qr_signature}
                  eventTitle={t.event?.title ?? "Event"}
                  location={t.event?.location ?? ""}
                  startsAt={t.event?.starts_at ?? t.created_at}
                  holderName=""
                  seat={t.seat}
                  typeName={t.ticket_type?.name ?? null}
                  paymentStatus={t.payment_status}
                />
                <Badge variant="outline" className="mt-2">
                  Checked in {t.used_at ? eventDayLabel(t.used_at) : ""}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cancelled</h2>
          <div className="mt-3 space-y-2">
            {cancelled.map((t) => (
              <Card key={t.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  {t.event?.title} · <span className="font-mono">{t.ticket_code}</span>
                </span>
                <Badge variant="destructive">Cancelled</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
