import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  Barcode,
  Camera,
  CheckCircle2,
  Download,
  Radio,
  ScanLine,
  Search,
  Undo2,
} from "lucide-react";
import {
  cancelTicket,
  checkIn,
  getEventManage,
  getMySession,
  markTicketPaid,
  refundTicket,
  type CheckInResult,
  type EventManageData,
} from "@/lib/server/ics.functions";
import { CHECK_IN_REASONS } from "@/lib/rules";
import { eventDayLabel, eventTimeLabel, peso } from "@/lib/format";
import { Badge, Button, Card, Input, Label, Modal, Textarea } from "@/components/ui";

export const Route = createFileRoute("/_authenticated/organizer/$eventId")({
  loader: async ({ params }) => {
    try {
      const [data, me] = await Promise.all([
        getEventManage({ data: { eventId: params.eventId } }),
        getMySession(),
      ]);
      return { data, me };
    } catch {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Manage Event — ICS Events" },
      { name: "description", content: "Verify cash payments, run check-in, view analytics." },
      { property: "og:title", content: "Manage Event — ICS Events" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManageEventPage,
});

type Tab = "payments" | "checkin" | "analytics";

function ManageEventPage() {
  const { data, me } = Route.useLoaderData() as {
    data: EventManageData;
    me: Awaited<ReturnType<typeof getMySession>>;
  };
  const isAdmin = me.roles.includes("admin");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("payments");
  const [search, setSearch] = useState("");
  const [payTarget, setPayTarget] = useState<EventManageData["tickets"][number] | null>(null);
  const [orNumber, setOrNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanLog, setScanLog] = useState<{ ok: boolean; text: string }[]>([]);

  const ev = data.event;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["organizer-event", ev.id] });

  const markPaid = useMutation({
    mutationFn: (input: { ticketId: string; orNumber: string | null; notes: string | null }) =>
      markTicketPaid({ data: input }),
    onSuccess: (res) => {
      toast.success(`${res.ticketCode} marked PAID`, {
        description: `Receipt ${res.receiptNumber} generated (${peso(res.amount)}) — OVI receipt ready in My Tickets.`,
        duration: 8000,
      });
      setPayTarget(null);
      setOrNumber("");
      setNotes("");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancel = useMutation({
    mutationFn: (ticketId: string) => cancelTicket({ data: { ticketId } }),
    onSuccess: () => {
      toast.success("Ticket cancelled");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const refund = useMutation({
    mutationFn: (ticketId: string) => refundTicket({ data: { ticketId } }),
    onSuccess: () => {
      toast.success("Refund recorded (audited)");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const scan = useMutation({
    mutationFn: (payload: string) => checkIn({ data: { eventId: ev.id, payload } }),
    onSuccess: (res: CheckInResult) => {
      if (res.ok) {
        toast.success(`✓ ${res.holder} checked in`);
        setScanLog((l) => [
          { ok: true, text: `✓ ${res.holder}${res.seat ? ` · ${res.seat}` : ""}${res.type ? ` · ${res.type}` : ""} — ${res.code}` },
          ...l,
        ]);
      } else {
        const reason = CHECK_IN_REASONS[res.reason] ?? res.reason;
        toast.error(reason);
        setScanLog((l) => [
          { ok: false, text: `✗ ${res.code ?? "unknown code"} — ${reason}` },
          ...l,
        ]);
      }
      setScanInput("");
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = data.tickets.filter((t) => t.payment_status === "unpaid" && t.status === "active");
  const paid = data.tickets.filter((t) => t.payment_status === "paid" && t.status !== "cancelled");
  const cancelled = data.tickets.filter((t) => t.status === "cancelled");
  const checkedInCount = data.tickets.filter((t) => t.status === "used").length;

  const matches = (t: EventManageData["tickets"][number]) =>
    !search ||
    t.holder_name.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
    (t.holder_student_id ?? "").includes(search);

  const filteredPending = pending.filter(matches);

  function exportCsv() {
    const rows = [
      ["code", "holder", "student_id", "type", "price", "payment_status", "status", "seat"],
      ...data.tickets.map((t) => [
        t.ticket_code,
        t.holder_name,
        t.holder_student_id ?? "",
        t.ticket_type?.name ?? "",
        String(Number(t.ticket_type?.price ?? 0)),
        t.payment_status,
        t.status,
        t.seat ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ev.slug}-tickets.csv`;
    a.click();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <div className="mt-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/organizer" className="text-xs text-muted-foreground hover:text-foreground">← Dashboard</Link>
          <h1 className="mt-1 font-display text-3xl">{ev.title}</h1>
          <p className="text-sm text-muted-foreground">
            {eventDayLabel(ev.starts_at)} · {eventTimeLabel(ev.starts_at)} · {ev.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ev.status === "published" ? "success" : ev.status === "pending_review" ? "gold" : "outline"}>
            {ev.status}
          </Badge>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Export list
          </Button>
        </div>
      </div>

      <div className="mt-5 flex gap-1 rounded-xl border border-border bg-card p-1">
        {(
          [
            { key: "payments", label: `Payments (${pending.length} pending)`, icon: Barcode },
            { key: "checkin", label: "Check-in", icon: ScanLine },
            { key: "analytics", label: "Analytics", icon: Radio },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent"
            }`}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- PAYMENTS ---------------- */}
      {tab === "payments" && (
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, ticket code or student ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-4 space-y-3">
            {filteredPending.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No pending cash payments{search ? " matching search" : ""}. Reservations appear here the moment a student reserves.
              </Card>
            )}
            {filteredPending.map((t) => (
              <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono text-sm font-semibold text-primary">{t.ticket_code}</p>
                  <p className="text-sm font-semibold">
                    {t.holder_name}
                    {t.holder_student_id ? ` · ${t.holder_student_id}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.ticket_type?.name} · {peso(Number(t.ticket_type?.price ?? 0))} · reserved{" "}
                    {eventDayLabel(t.created_at)} · {t.seat ? `seat ${t.seat}` : "no seat yet"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setPayTarget(t)}>
                    <CheckCircle2 className="size-4" /> Verify PAID
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancel.mutate(t.id)}>
                    <Ban className="size-4" /> Cancel
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {paid.length > 0 && (
            <>
              <h2 className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Paid & issued ({paid.length})
              </h2>
              <div className="mt-3 space-y-2">
                {paid.filter(matches).map((t) => (
                  <Card key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <span>
                      <span className="font-mono">{t.ticket_code}</span> · {t.holder_name} ·{" "}
                      {peso(Number(t.ticket_type?.price ?? 0))} ·{" "}
                      <span className="text-muted-foreground">
                        verified {t.verified_at ? eventDayLabel(t.verified_at) : "—"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="success">PAID</Badge>
                      {isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => refund.mutate(t.id)}>
                          <Undo2 className="size-4" /> Refund
                        </Button>
                      )}
                    </span>
                  </Card>
                ))}
              </div>
            </>
          )}

          {cancelled.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">{cancelled.length} cancelled ticket(s).</p>
          )}
        </div>
      )}

      {/* ---------------- CHECK-IN ---------------- */}
      {tab === "checkin" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--success)]" />
              </span>
              <span className="text-sm font-semibold">LIVE</span>
              <span className="text-sm text-muted-foreground">
                {checkedInCount} checked in / {data.tickets.filter((t) => t.status !== "cancelled").length} registered
              </span>
            </div>

            <Card className="mt-4 p-4">
              <Label className="flex items-center gap-2">
                <Camera className="size-4" /> Scan or enter ticket
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Camera mode in the kiosk app — here, paste the QR content (ICS|CODE|SIGNATURE) or type the ticket code manually.
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="ICS|TKT-2026-…|sig  or  TKT-2026-A1B2C3"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && scanInput.trim() && scan.mutate(scanInput.trim())}
                  className="font-mono"
                />
                <Button disabled={!scanInput.trim() || scan.isPending} onClick={() => scan.mutate(scanInput.trim())}>
                  Check in
                </Button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent scans</p>
                <div className="mt-2 space-y-1">
                  {scanLog.length === 0 && data.checkIns.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">No scans yet — the gate is open.</p>
                  )}
                  {scanLog.map((l, i) => (
                    <p key={i} className={`rounded-md px-2 py-1 text-xs ${l.ok ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-destructive/10 text-destructive"}`}>
                      {l.text}
                    </p>
                  ))}
                  {scanLog.length === 0 &&
                    data.checkIns.map((c) => (
                      <p key={c.id} className="flex justify-between rounded-md px-2 py-1 text-xs text-muted-foreground">
                        <span>✓ {c.ticket?.holder_name} — {c.ticket?.ticket_code}</span>
                        <span>{eventTimeLabel(c.check_in_at)} · {c.method}</span>
                      </p>
                    ))}
                </div>
              </div>
            </Card>
          </div>

          <Card className="h-fit p-4">
            <p className="text-sm font-semibold">Scanner alerts</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>• Duplicate scans are rejected — one scan per ticket.</li>
              <li>• <strong className="text-destructive">UNPAID tickets cannot check in</strong> — collect cash first.</li>
              <li>• QR signatures are HMAC-verified; tampered QRs are rejected.</li>
              <li>• Cancelled or refunded tickets are always denied.</li>
            </ul>
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Try a demo ticket</p>
              {data.tickets
                .filter((t) => t.payment_status === "paid" && t.status === "active")
                .slice(0, 3)
                .map((t) => (
                  <button
                    key={t.id}
                    className="block w-full truncate rounded-md border border-border px-2 py-1.5 text-left font-mono text-[11px] hover:bg-accent cursor-pointer"
                    onClick={() => setScanInput(t.ticket_code)}
                  >
                    {t.ticket_code} · {t.holder_name}
                  </button>
                ))}
              {data.tickets.filter((t) => t.payment_status === "unpaid").slice(0, 1).map((t) => (
                <button
                  key={t.id}
                  className="block w-full truncate rounded-md border border-destructive/40 px-2 py-1.5 text-left font-mono text-[11px] text-destructive hover:bg-destructive/5 cursor-pointer"
                  onClick={() => setScanInput(t.ticket_code)}
                  title="Unpaid — scanning this shows the rejection"
                >
                  {t.ticket_code} · {t.holder_name} (unpaid)
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- ANALYTICS ---------------- */}
      {tab === "analytics" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Registrations</p>
            <p className="mt-1 font-display text-4xl">{data.tickets.filter((t) => t.status !== "cancelled").length}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${ev.capacity ? Math.min(100, (data.tickets.filter((t) => t.status !== "cancelled").length / ev.capacity) * 100) : 0}%`,
                }}
              />
            </div>
            {ev.capacity && <p className="mt-1 text-xs text-muted-foreground">of {ev.capacity} capacity</p>}
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Paid vs unpaid</p>
            <p className="mt-1 font-display text-4xl">
              {paid.length}
              <span className="text-lg text-muted-foreground"> paid · {pending.length} unpaid</span>
            </p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full">
              <div className="bg-primary" style={{ width: `${(paid.length / Math.max(1, paid.length + pending.length)) * 100}%` }} />
              <div className="bg-gold" style={{ width: `${(pending.length / Math.max(1, paid.length + pending.length)) * 100}%` }} />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Revenue — collected</p>
            <p className="mt-1 font-display text-4xl text-primary">
              {peso(paid.reduce((s, t) => s + Number(t.ticket_type?.price ?? 0), 0))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Cash received & verified by officers</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Revenue — pending</p>
            <p className="mt-1 font-display text-4xl text-gold-deep">
              {peso(pending.reduce((s, t) => s + Number(t.ticket_type?.price ?? 0), 0))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting cash at the ICS office</p>
          </Card>

          <Card className="p-5 sm:col-span-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Check-ins</p>
            <p className="mt-1 font-display text-4xl">{checkedInCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.tickets.filter((t) => t.status !== "cancelled").length
                ? `${Math.round((checkedInCount / data.tickets.filter((t) => t.status !== "cancelled").length) * 100)}% attendance rate`
                : "No registrations yet"}
            </p>
          </Card>
        </div>
      )}

      {/* -------- Mark PAID modal -------- */}
      <Modal open={!!payTarget} onClose={() => setPayTarget(null)} title="Mark as PAID">
        {payTarget && (
          <div className="space-y-3">
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <p className="font-mono font-semibold text-primary">{payTarget.ticket_code}</p>
              <p>
                {payTarget.holder_name}
                {payTarget.holder_student_id ? ` · ${payTarget.holder_student_id}` : ""}
              </p>
              <p className="mt-1 text-lg font-semibold">{peso(Number(payTarget.ticket_type?.price ?? 0))}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ornum">OR number (optional)</Label>
              <Input
                id="ornum"
                value={orNumber}
                onChange={(e) => setOrNumber(e.target.value)}
                placeholder="OR-2026-00123"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cash received by</Label>
              <Input value={data.staffName} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">Auto-filled from OnePass — recorded for audit.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. paid in cash at the office" />
            </div>
            <p className="text-xs text-muted-foreground">
              Confirming issues the ticket, generates the HMAC-signed OVI receipt and records this audit entry (who, when, amount).
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
              <Button
                disabled={markPaid.isPending}
                onClick={() => markPaid.mutate({ ticketId: payTarget.id, orNumber: orNumber || null, notes: notes || null })}
              >
                {markPaid.isPending ? "Confirming…" : "Confirm PAID"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
