import { useRef } from "react";
import { eventDayLabel, eventTimeLabel, peso } from "@/lib/format";

export type ReceiptOviProps = {
  receiptNumber: string;
  eventTitle: string;
  eventDate?: string;
  location?: string | null;
  holderName?: string | null;
  studentId?: string | null;
  typeName?: string | null;
  ticketCode?: string | null;
  lineItems: { label: string; qty: number; amount: number }[];
  total: number;
  paymentMethod?: string | null;
  orNumber?: string | null;
  paidAt?: string | null;
  createdAt: string;
  compact?: boolean;
};

export function ReceiptOvi(props: ReceiptOviProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function downloadPng() {
    if (!cardRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${props.receiptNumber}.png`;
    a.click();
  }

  return (
    <div className="receipt-stage">
      <div ref={cardRef} className="receipt-ovi">
        <div className="receipt-ovi__sheen" />
        <span className="ovi-watermark">OVI · OFFICIAL</span>

        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-85">ICS Events</p>
          <h3 className="font-display text-2xl">Official Receipt</h3>
          <div className="mt-1 h-px w-full bg-white/30" />

          <div className="mt-3 flex items-center justify-between font-mono text-xs opacity-90">
            <span>{props.receiptNumber}</span>
            <span>{eventDayLabel(props.createdAt)}</span>
          </div>

          {(props.holderName || props.studentId) && (
            <div className="mt-4 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Billed to</p>
              <p className="font-semibold">
                {props.holderName}
                {props.studentId ? ` · ${props.studentId}` : ""}
              </p>
            </div>
          )}

          <div className="mt-3 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Event</p>
            <p className="font-semibold leading-snug">{props.eventTitle}</p>
            {props.eventDate && (
              <p className="text-xs opacity-85">
                {eventDayLabel(props.eventDate)} · {eventTimeLabel(props.eventDate)}
                {props.location ? ` · ${props.location}` : ""}
              </p>
            )}
          </div>

          <div className="mt-4 space-y-1 text-sm">
            {props.lineItems.map((li, i) => (
              <div key={i} className="flex justify-between">
                <span className="opacity-90">
                  {li.label} × {li.qty}
                </span>
                <span className="font-mono">{peso(li.amount)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-end justify-between border-t border-white/30 pt-3">
            <div className="text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Payment</p>
              <p className="font-mono text-xs uppercase">
                {props.paymentMethod ?? "cash"} · {props.orNumber ?? "no OR number"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Total</p>
              <p className="font-display text-3xl leading-none">{peso(props.total)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[11px] opacity-90">{props.ticketCode}</span>
            <span className="stamp-paid border-white/70">PAID ✓</span>
          </div>

          {!props.compact && (
            <p className="mt-3 font-mono text-[9px] uppercase tracking-wider opacity-60">
              Verify at events.ics.org/verify/{props.receiptNumber} · HMAC-signed
            </p>
          )}
        </div>
      </div>

      {!props.compact && (
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Hover / tilt to see the optically-variable ink shift ·{" "}
          <button
            onClick={() => void downloadPng()}
            className="font-semibold text-primary underline-offset-2 hover:underline cursor-pointer"
          >
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}
