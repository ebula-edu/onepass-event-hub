import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Clock, Landmark } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { peso } from "@/lib/format";
import { eventDayLabel, eventTimeLabel } from "@/lib/format";

export type ReservationCardProps = {
  reference: string;
  ticketCode: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  typeName: string;
  amount: number;
};

export function ReservationCard(props: ReservationCardProps) {
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(`ICS|${props.ticketCode}`, { margin: 1, width: 240 }).then(setQr);
  }, [props.ticketCode]);

  return (
    <Card className="overflow-hidden border-gold/50">
      <div className="flex items-center justify-between bg-gold/15 px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-deep">
          <Clock className="size-3.5" /> Reservation pending payment
        </span>
        <Badge variant="gold">UNPAID</Badge>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h3 className="font-display text-xl leading-tight">{props.eventTitle}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {eventDayLabel(props.eventDate)} · {eventTimeLabel(props.eventDate)} · {props.location}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-sm">
            <Landmark className="size-4 text-primary" />
            <span>
              Pay <strong>{peso(props.amount)}</strong> in cash at the ICS office — show this reference to the officer.
            </span>
          </p>
          <p className="mt-3 font-mono text-sm tracking-wider text-primary">{props.reference}</p>
          <p className="text-xs text-muted-foreground">
            Type: {props.typeName} · Your ticket is issued the moment the officer marks it PAID.
          </p>
        </div>
        {qr && (
          <div className="shrink-0 rounded-lg border border-border bg-white p-2">
            <img src={qr} alt="Reservation QR" className="size-24" />
          </div>
        )}
      </div>
    </Card>
  );
}
