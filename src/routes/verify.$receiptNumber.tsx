import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShieldX } from "lucide-react";
import { verifyReceiptPublic } from "@/lib/server/ics.functions";
import { eventDayLabel, peso } from "@/lib/format";
import { Badge, Card } from "@/components/ui";

export const Route = createFileRoute("/verify/$receiptNumber")({
  loader: ({ params }) => verifyReceiptPublic({ data: { receiptNumber: params.receiptNumber } }),
  head: ({ params }) => ({
    meta: [
      { title: `Verify ${params.receiptNumber} — ICS Events` },
      {
        name: "description",
        content: "Public verification page for ICS Events OVI receipts. No personal data shown.",
      },
      { property: "og:title", content: `Verify ${params.receiptNumber} — ICS Events` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const receipt = Route.useLoaderData();
  const valid = !!receipt;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      {valid ? (
        <Card className="border-[var(--success)]/40 p-6 text-center">
          <BadgeCheck className="mx-auto size-12 text-[var(--success)]" />
          <h1 className="mt-3 font-display text-2xl">Valid receipt</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Verified against the ICS Events ledger · HMAC signature on file · no personal data shown
          </p>
          <div className="mt-5 space-y-2 text-left text-sm">
            <Row label="Receipt no." value={<span className="font-mono">{receipt.receipt_number}</span>} />
            <Row label="Event" value={receipt.event_title ?? "—"} />
            <Row label="Ticket type" value={receipt.ticket_type_name ?? "—"} />
            <Row label="Amount" value={<strong>{peso(Number(receipt.total_amount))}</strong>} />
            <Row label="Status" value={<Badge variant="success">{receipt.payment_status?.toUpperCase() ?? "PAID"} ✓</Badge>} />
            <Row label="Issued" value={receipt.issued_at ? eventDayLabel(receipt.issued_at) : "—"} />
          </div>
        </Card>
      ) : (
        <Card className="border-destructive/40 p-6 text-center">
          <ShieldX className="mx-auto size-12 text-destructive" />
          <h1 className="mt-3 font-display text-2xl">Receipt not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This receipt number does not exist in the ICS Events ledger. If you received it on paper, check for typos.
          </p>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Public verification page · powered by{" "}
        <Link to="/" className="text-primary hover:underline">ICS Events</Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
