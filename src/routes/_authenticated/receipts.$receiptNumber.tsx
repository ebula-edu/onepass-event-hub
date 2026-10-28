import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { getReceiptForOwner, type OwnerReceipt } from "@/lib/server/ics.functions";
import { ReceiptOvi } from "@/components/receipt-ovi";
import { Button } from "@/components/ui";

export const Route = createFileRoute("/_authenticated/receipts/$receiptNumber")({
  loader: ({ params }) => getReceiptForOwner({ data: { receiptNumber: params.receiptNumber } }),
  head: ({ params }) => ({
    meta: [
      { title: `Receipt ${params.receiptNumber} — ICS Events` },
      { name: "description", content: "HMAC-signed OVI official receipt from ICS Events." },
      { property: "og:title", content: `Receipt ${params.receiptNumber} — ICS Events` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const data = Route.useLoaderData() as OwnerReceipt;
  const receipt = data.receipt;
  const ticket = receipt?.tickets?.[0];

  if (!receipt) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Receipt not found.</div>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-16">
      <div className="mt-8 flex items-center gap-2">
        <BadgeCheck className="size-5 text-[var(--success)]" />
        <h1 className="font-display text-2xl">Receipt — {receipt.receipt_number}</h1>
      </div>

      <div className="mt-6">
        <ReceiptOvi
          receiptNumber={receipt.receipt_number}
          eventTitle={receipt.event?.title ?? "Event"}
          eventDate={receipt.event?.starts_at}
          location={receipt.event?.location}
          holderName={ticket?.holder_name}
          studentId={ticket?.holder_student_id}
          typeName={ticket?.ticket_type?.name}
          ticketCode={ticket?.ticket_code}
          lineItems={receipt.line_items ?? []}
          total={Number(receipt.total_amount)}
          paymentMethod={data.payment?.payment_method}
          orNumber={data.payment?.or_number}
          paidAt={data.payment?.paid_at}
          createdAt={receipt.created_at}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/verify/$receiptNumber" params={{ receiptNumber: receipt.receipt_number }}>
          <Button variant="outline" size="sm">
            <ShieldCheck className="size-4" /> Verify online (public page)
          </Button>
        </Link>
        <Link to="/my-tickets">
          <Button variant="ghost" size="sm">Back to My Tickets</Button>
        </Link>
      </div>
    </div>
  );
}
