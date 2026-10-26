/**
 * Pure check-in rules — shared between the check-in server function and tests.
 */

export type CheckInTicketState = {
  status: string;
  payment_status: string;
};

export type CheckInContext = {
  signatureValid: boolean;
  eventId: string;
  ticketEventId: string | null;
  alreadyCheckedIn: boolean;
};

export type CheckInDecision = {
  allowed: boolean;
  reason:
    | "ok"
    | "bad_signature"
    | "not_found"
    | "cancelled"
    | "used"
    | "unpaid"
    | "refunded"
    | "wrong_event";
};

export function evaluateCheckIn(
  ticket: CheckInTicketState | null,
  ctx: CheckInContext,
): CheckInDecision {
  if (!ticket || !ctx.signatureValid) return { allowed: false, reason: ticket ? "bad_signature" : "not_found" };
  if (ctx.ticketEventId !== ctx.eventId) return { allowed: false, reason: "wrong_event" };
  if (ticket.status === "cancelled") return { allowed: false, reason: "cancelled" };
  if (ticket.status === "used" || ctx.alreadyCheckedIn) return { allowed: false, reason: "used" };
  if (ticket.payment_status === "refunded") return { allowed: false, reason: "refunded" };
  if (ticket.payment_status !== "paid") return { allowed: false, reason: "unpaid" };
  return { allowed: true, reason: "ok" };
}

export const CHECK_IN_REASONS: Record<Exclude<CheckInDecision["reason"], "ok">, string> = {
  bad_signature: "Invalid or tampered QR signature",
  not_found: "Ticket code not recognized",
  cancelled: "Ticket was cancelled — entry denied",
  used: "Duplicate scan — this ticket already checked in",
  unpaid: "UNPAID ticket — collect cash at the office first",
  refunded: "Ticket was refunded — entry denied",
  wrong_event: "Ticket belongs to a different event",
};
