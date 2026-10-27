import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Badge } from "@/components/ui";
import { eventDayLabel, eventTimeLabel } from "@/lib/format";

export type Ticket3DProps = {
  ticketCode: string;
  qrSignature: string;
  eventTitle: string;
  location: string;
  startsAt: string;
  holderName: string;
  seat?: string | null;
  typeName?: string | null;
  paymentStatus?: string;
  compact?: boolean;
};

export function Ticket3D(props: Ticket3DProps) {
  const [flipped, setFlipped] = useState(false);
  const [qr, setQr] = useState<string>("");
  const faceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(`ICS|${props.ticketCode}|${props.qrSignature}`, {
      margin: 1,
      width: 320,
      color: { dark: "#18181b", light: "#ffffff" },
    }).then(setQr);
  }, [props.ticketCode, props.qrSignature]);

  async function downloadPng() {
    if (!faceRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(faceRef.current, { pixelRatio: 3, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${props.ticketCode}.png`;
    a.click();
  }

  const paid = props.paymentStatus !== "unpaid";

  return (
    <div className="ticket-stage">
      <div
        className={`ticket-3d ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((v) => !v)}
        role="button"
        aria-label="Ticket — tap to flip"
      >
        <div className="ticket-3d__inner">
          {/* front */}
          <div ref={faceRef} className="ticket-3d__face">
            <div className="ticket-3d__guilloche" />
            <div className="relative flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-80">
                ICS Events · {new Date(props.startsAt).getFullYear()}
              </span>
              {paid ? (
                <span className="stamp-paid border-primary-foreground/60">
                  {props.paymentStatus === "paid" ? "PAID ✓" : "ISSUED"}
                </span>
              ) : (
                <span className="stamp-paid border-primary-foreground/40">UNPAID</span>
              )}
            </div>

            <div className="relative mt-3 flex-1">
              <h3 className="font-display text-2xl leading-tight">{props.eventTitle}</h3>
              <p className="mt-1 text-sm opacity-85">
                {eventDayLabel(props.startsAt)} · {eventTimeLabel(props.startsAt)} · {props.location}
              </p>
              <p className="mt-2 text-sm font-semibold tracking-wide">{props.holderName}</p>
            </div>

            <div className="ticket-3d__tear relative mt-2 flex items-end justify-between pt-3">
              <div className="flex gap-4 font-mono text-[11px]">
                <span>
                  <span className="block text-[9px] uppercase tracking-widest opacity-70">Seat</span>
                  {props.seat ?? "—"}
                </span>
                <span>
                  <span className="block text-[9px] uppercase tracking-widest opacity-70">Type</span>
                  {props.typeName ?? "General"}
                </span>
              </div>
              <span className="font-mono text-xs tracking-wider opacity-90">{props.ticketCode}</span>
            </div>
            <span className="ticket-3d__notch ticket-3d__notch--left" />
            <span className="ticket-3d__notch ticket-3d__notch--right" />
          </div>

          {/* back */}
          <div className="ticket-3d__face ticket-3d__back">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
              Scan at the gate
            </span>
            <div className="relative flex flex-1 items-center justify-center gap-5">
              {qr ? (
                <img src={qr} alt="Ticket QR code" className="size-28 rounded-lg bg-white p-1.5" />
              ) : (
                <div className="size-28 animate-pulse rounded-lg bg-white/20" />
              )}
              <div className="max-w-[180px] text-xs leading-relaxed opacity-85">
                <p className="font-mono text-[11px] tracking-wider">{props.ticketCode}</p>
                <p className="mt-2">
                  Signed with HMAC via OnePass. Present this QR at check-in — one scan per ticket.
                </p>
              </div>
            </div>
            <span className="ticket-3d__notch ticket-3d__notch--left" />
            <span className="ticket-3d__notch ticket-3d__notch--right" />
          </div>
        </div>
      </div>

      {!props.compact && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Tap the ticket to flip · QR on the back</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void downloadPng();
            }}
            className="font-semibold text-primary underline-offset-2 hover:underline cursor-pointer"
          >
            Download PNG
          </button>
        </div>
      )}
      {props.compact && (
        <div className="mt-2 text-center">
          <Badge variant="outline">Tap to flip</Badge>
        </div>
      )}
    </div>
  );
}
