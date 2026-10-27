import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { signHmac, verifyHmac, newTicketCode, newReceiptNumber } from "@/lib/signing";
import { evaluateCheckIn } from "@/lib/rules";
import { slugify } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Public (publishable-key) client for anonymous reads                 */
/* ------------------------------------------------------------------ */

function createPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Shared types                                                        */
/* ------------------------------------------------------------------ */

export type PublicEventSummary = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_type: string;
  category: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  reserved_count: number;
  paid_count: number;
  tickets_left: number;
};

export type MyTicketRow = {
  id: string;
  ticket_code: string;
  event_id: string;
  seat: string | null;
  status: string;
  payment_status: string;
  issued_at: string | null;
  used_at: string | null;
  verified_at: string | null;
  qr_payload: string;
  qr_signature: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    slug: string;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    event_type: string;
    category: string | null;
  } | null;
  ticket_type: { id: string; name: string; price: number } | null;
  receipts: { receipt_number: string; total_amount: number; created_at: string }[];
};

async function assertStaff(
  supabase: Database["public"]["Tables"] extends never ? never : any,
  userId: string,
  min: "officer" | "admin" = "officer",
): Promise<{ isOfficer: boolean; isAdmin: boolean }> {
  const { data: officer } = await supabase.rpc("has_role", { _user_id: userId, _role: "officer" });
  const { data: admin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  const isOfficer = officer === true;
  const isAdmin = admin === true;
  const ok = min === "admin" ? isAdmin : isOfficer || isAdmin;
  if (!ok) throw new Error("Forbidden — officer or admin role required");
  return { isOfficer, isAdmin };
}

/* ------------------------------------------------------------------ */
/* Session / role                                                      */
/* ------------------------------------------------------------------ */

export const getMySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, student_id")
      .eq("id", userId)
      .maybeSingle();
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return {
      userId,
      email: (claims as { email?: string } | null)?.email ?? null,
      name: profile?.display_name ?? null,
      studentId: profile?.student_id ?? null,
      roles: (roles ?? []).map((r) => r.role),
    };
  });

/* ------------------------------------------------------------------ */
/* Public event reads (SSR-safe, PII-free)                             */
/* ------------------------------------------------------------------ */

export const getPublishedEvents = createServerFn({ method: "GET" }).handler(async () => {
  const supa = createPublicClient();
  const { data, error } = await supa.rpc("list_published_events");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicEventSummary[];
});

export const getEventBySlug = createServerFn({ method: "POST" })
  .inputValidator((input: string) => input)
  .handler(async ({ data: slug }) => {
    const supa = createPublicClient();
    const { data, error } = await supa.rpc("get_event_by_slug", { _slug: slug });
    if (error) throw new Error(error.message);
    const ev = (data ?? [])[0] as unknown as PublicEventSummary | undefined;
    if (!ev) return null;
    const { data: types } = await supa
      .from("ticket_types")
      .select("id, name, description, price, max_per_user, scopes_required, status")
      .eq("event_id", ev.id)
      .eq("status", "active")
      .order("price");
    return { event: ev, ticketTypes: (types ?? []) as PublicTicketType[] };
  });

export type PublicTicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  max_per_user: number | null;
  scopes_required: string[] | null;
  status: string;
};

/* ------------------------------------------------------------------ */
/* Reservation (attendee)                                              */
/* ------------------------------------------------------------------ */

export const reserveTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ slug: z.string(), ticketTypeId: z.string().uuid() }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: ev } = await supabase
      .from("events")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!ev) throw new Error("Event not found or not published");

    const { data: tt } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("id", data.ticketTypeId)
      .eq("event_id", ev.id)
      .eq("status", "active")
      .maybeSingle();
    if (!tt) throw new Error("Ticket type unavailable");

    const { count: taken } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ev.id)
      .neq("status", "cancelled");
    if (ev.capacity && (taken ?? 0) >= ev.capacity) throw new Error("This event is full");

    const { count: mine } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("ticket_type_id", tt.id)
      .eq("holder_id", userId)
      .neq("status", "cancelled");
    if ((mine ?? 0) >= (tt.max_per_user ?? 5)) {
      throw new Error(`Limit of ${tt.max_per_user ?? 5} ticket(s) per person reached`);
    }

    const scopes = (tt.scopes_required as string[] | null) ?? [];
    const needsStudentId = ev.event_type === "member_only" || scopes.includes("student_id");
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, student_id")
      .eq("id", userId)
      .maybeSingle();
    if (needsStudentId && !profile?.student_id) {
      throw new Error("This event requires a verified student ID through OnePass");
    }

    // unique ticket code
    let code = newTicketCode();
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabase
        .from("tickets")
        .select("id")
        .eq("ticket_code", code)
        .maybeSingle();
      if (!clash) break;
      code = newTicketCode();
    }
    const signature = await signHmac(code);
    const isFree = Number(tt.price) === 0;
    const now = new Date().toISOString();

    const { data: ticket, error: insErr } = await supabase
      .from("tickets")
      .insert({
        ticket_code: code,
        event_id: ev.id,
        ticket_type_id: tt.id,
        holder_id: userId,
        holder_name: profile?.display_name || "ICS Student",
        holder_email: (claims as { email?: string } | null)?.email ?? "",
        holder_student_id: profile?.student_id ?? null,
        qr_payload: code,
        qr_signature: signature,
        status: "active",
        payment_status: isFree ? "paid" : "unpaid",
        issued_at: isFree ? now : null,
        metadata: {},
      })
      .select("id, ticket_code, payment_status")
      .single();
    if (insErr || !ticket) throw new Error(insErr?.message ?? "Could not create ticket");

    let receiptNumber: string | null = null;
    if (isFree) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: pay } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: userId,
          event_id: ev.id,
          ticket_id: ticket.id,
          amount: 0,
          status: "paid",
          paid_at: now,
          notes: "Free event registration",
        })
        .select("id")
        .single();
      receiptNumber = newReceiptNumber();
      await supabaseAdmin.from("receipts").insert({
        receipt_number: receiptNumber,
        user_id: userId,
        event_id: ev.id,
        ticket_id: ticket.id,
        payment_id: pay?.id ?? null,
        total_amount: 0,
        line_items: [{ label: tt.name, qty: 1, amount: 0 }],
        hmac_signature: await signHmac(`${receiptNumber}|0.00`),
      });
    }

    return {
      ticketCode: ticket.ticket_code,
      issued: isFree,
      receiptNumber,
      reference: ticket.ticket_code.replace("TKT-", "RSV-"),
    };
  });

/* ------------------------------------------------------------------ */
/* My tickets                                                          */
/* ------------------------------------------------------------------ */

export const getMyTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `id, ticket_code, event_id, seat, status, payment_status, issued_at, used_at,
         verified_at, qr_payload, qr_signature, created_at,
         event:events(id, title, slug, location, starts_at, ends_at, event_type, category),
         ticket_type:ticket_types(id, name, price),
         receipts(receipt_number, total_amount, created_at)`,
      )
      .eq("holder_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MyTicketRow[];
  });

export const getReceiptForOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ receiptNumber: z.string() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("receipts")
      .select(
        `id, receipt_number, total_amount, currency, line_items, created_at,
         event:events(id, title, location, starts_at),
         tickets(id, ticket_code, seat, payment_status, ticket_type:ticket_types(name), holder_name, holder_student_id)`,
      )
      .eq("receipt_number", data.receiptNumber)
      .maybeSingle();
    if (!row) throw new Error("Receipt not found");
    if (row.user_id !== userId) {
      const { data: staff } = await supabase.rpc("has_role", { _user_id: userId, _role: "officer" });
      const { data: admin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (staff !== true && admin !== true) throw new Error("Receipt not found");
    }
    const { data: pay } = await supabase
      .from("payments")
      .select("payment_method, or_number, notes, status, paid_at")
      .eq("id", row.payment_id ?? "")
      .maybeSingle();
    return { receipt: row, payment: pay } as unknown as OwnerReceipt;
  });

export type OwnerReceipt = {
  receipt: {
    id: string;
    receipt_number: string;
    total_amount: number;
    currency: string;
    line_items: { label: string; qty: number; amount: number }[];
    created_at: string;
    event: { id: string; title: string; location: string | null; starts_at: string } | null;
    tickets: {
      id: string;
      ticket_code: string;
      seat: string | null;
      payment_status: string;
      ticket_type: { name: string } | null;
      holder_name: string;
      holder_student_id: string | null;
    }[];
  } | null;
  payment: { payment_method: string; or_number: string | null; notes: string | null; status: string; paid_at: string | null } | null;
};

/* ------------------------------------------------------------------ */
/* Staff: mark PAID / cancel / refund                                  */
/* ------------------------------------------------------------------ */

export const markTicketPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        ticketId: z.string().uuid(),
        orNumber: z.string().max(60).optional().nullable(),
        notes: z.string().max(300).optional().nullable(),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: t } = await supabaseAdmin
      .from("tickets")
      .select("id, ticket_code, event_id, ticket_type_id, holder_id, holder_name, payment_status, status")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (!t) throw new Error("Ticket not found");
    if (t.payment_status === "paid") throw new Error("Ticket is already PAID");
    if (t.status === "cancelled") throw new Error("Ticket was cancelled — cannot be marked PAID");

    const { data: tt } = await supabaseAdmin
      .from("ticket_types")
      .select("name, price")
      .eq("id", t.ticket_type_id ?? "")
      .maybeSingle();
    const amount = Number(tt?.price ?? 0);
    const now = new Date().toISOString();

    await supabaseAdmin
      .from("tickets")
      .update({ payment_status: "paid", verified_by: userId, verified_at: now, issued_at: now })
      .eq("id", t.id);

    const { data: pay } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: t.holder_id,
        event_id: t.event_id,
        ticket_id: t.id,
        amount,
        or_number: data.orNumber ?? null,
        received_by: userId,
        status: "paid",
        paid_at: now,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();

    const receiptNumber = newReceiptNumber();
    await supabaseAdmin.from("receipts").insert({
      receipt_number: receiptNumber,
      user_id: t.holder_id,
      event_id: t.event_id,
      ticket_id: t.id,
      payment_id: pay?.id ?? null,
      total_amount: amount,
      line_items: [{ label: `${tt?.name ?? "Ticket"} — ${t.holder_name}`, qty: 1, amount }],
      hmac_signature: await signHmac(`${receiptNumber}|${amount.toFixed(2)}`),
    });

    return { ticketCode: t.ticket_code, receiptNumber, amount, holder: t.holder_name };
  });

export const cancelTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ ticketId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("tickets")
      .update({ status: "cancelled" })
      .eq("id", data.ticketId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const refundTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ ticketId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("tickets")
      .update({ payment_status: "refunded" })
      .eq("id", data.ticketId);
    await supabaseAdmin
      .from("payments")
      .update({ status: "refunded", refunded_at: now })
      .eq("ticket_id", data.ticketId);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Staff: check-in                                                     */
/* ------------------------------------------------------------------ */

export const checkIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        eventId: z.string().uuid(),
        payload: z.string().min(4).max(200),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    let code = data.payload.trim().toUpperCase();
    let sig: string | undefined;
    if (code.includes("|")) {
      const parts = code.split("|");
      code = (parts[1] ?? parts[0]).trim();
      sig = parts[2]?.trim() || undefined;
    }

    const { data: ticket } = await supabase
      .from("tickets")
      .select(
        "id, ticket_code, event_id, status, payment_status, used_at, holder_name, seat, qr_signature, ticket_type:ticket_types(name)",
      )
      .eq("ticket_code", code)
      .maybeSingle();
    if (!ticket) return { ok: false, reason: "not_found" as const };

    const { count: prior } = await supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("ticket_id", ticket.id);
    const alreadyCheckedIn = (prior ?? 0) > 0;

    const signatureValid = sig
      ? sig.toLowerCase() === ticket.qr_signature || (await verifyHmac(code, sig))
      : await verifyHmac(code, ticket.qr_signature);

    const decision = evaluateCheckIn(
      { status: ticket.status, payment_status: ticket.payment_status },
      {
        signatureValid,
        eventId: data.eventId,
        ticketEventId: ticket.event_id,
        alreadyCheckedIn,
      },
    );
    if (!decision.allowed) {
      return {
        ok: false,
        reason: decision.reason,
        code: ticket.ticket_code,
        holder: ticket.holder_name,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    await supabaseAdmin.from("check_ins").insert({
      event_id: ticket.event_id,
      ticket_id: ticket.id,
      scanned_by: userId,
      method: sig ? "qr" : "manual",
    });
    await supabaseAdmin
      .from("tickets")
      .update({ status: "used", used_at: now })
      .eq("id", ticket.id);

    return {
      ok: true,
      code: ticket.ticket_code,
      holder: ticket.holder_name,
      seat: ticket.seat,
      type: (ticket.ticket_type as { name: string } | null)?.name ?? null,
      checkedInAt: now,
    };
  });

export type CheckInResult = Awaited<ReturnType<typeof checkIn>>;

/* ------------------------------------------------------------------ */
/* Staff: events CRUD + review workflow                                */
/* ------------------------------------------------------------------ */

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        title: z.string().min(3).max(120),
        description: z.string().max(2000).optional().nullable(),
        eventType: z.enum(["free", "paid", "member_only"]),
        category: z.string().max(40).optional().nullable(),
        location: z.string().max(120).optional().nullable(),
        startsAt: z.string(),
        endsAt: z.string().optional().nullable(),
        capacity: z.number().int().min(1).max(100000).optional().nullable(),
        ticketTypes: z
          .array(
            z.object({
              name: z.string().min(1).max(60),
              description: z.string().max(200).optional().nullable(),
              price: z.number().min(0).max(1000000),
              quota: z.number().int().min(1).max(100000).optional().nullable(),
            }),
          )
          .min(1),
        submitForReview: z.boolean(),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    await assertStaff(supabase, userId);

    let slug = slugify(data.title);
    const { data: clash } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
    if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const { data: ev, error } = await supabase
      .from("events")
      .insert({
        organizer_id: userId,
        organizer_role: (claims as { role?: string } | null)?.role ?? "officer",
        title: data.title,
        slug,
        description: data.description ?? null,
        event_type: data.eventType,
        category: data.category ?? null,
        location: data.location ?? null,
        starts_at: new Date(data.startsAt).toISOString(),
        ends_at: data.endsAt ? new Date(data.endsAt).toISOString() : null,
        capacity: data.capacity ?? null,
        status: data.submitForReview ? "pending_review" : "draft",
      })
      .select("id, slug, status, title")
      .single();
    if (error || !ev) throw new Error(error?.message ?? "Could not create event");

    const { error: ttErr } = await supabase.from("ticket_types").insert(
      data.ticketTypes.map((t) => ({
        event_id: ev.id,
        name: t.name,
        description: t.description ?? null,
        price: t.price,
        quota: t.quota ?? null,
        scopes_required: data.eventType === "member_only" ? ["student_id"] : [],
        status: "active",
      })),
    );
    if (ttErr) throw new Error(ttErr.message);

    return ev;
  });

export const reviewEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        eventId: z.string().uuid(),
        action: z.enum(["approve", "reject", "escalate", "cancel", "complete"]),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);
    const status =
      data.action === "approve"
        ? "published"
        : data.action === "reject"
          ? "draft"
          : data.action === "escalate"
            ? "pending_review"
            : data.action === "cancel"
              ? "cancelled"
              : "completed";
    const { error } = await supabase.from("events").update({ status }).eq("id", data.eventId);
    if (error) throw new Error(error.message);
    return { status };
  });

/* ------------------------------------------------------------------ */
/* Staff: dashboards                                                   */
/* ------------------------------------------------------------------ */

export const getOrganizerDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const { data: events } = await supabase
      .from("events")
      .select("id, title, slug, event_type, category, location, starts_at, capacity, status")
      .order("created_at", { ascending: false });
    if (!events || events.length === 0) return [];

    const ids = events.map((e) => e.id);
    const { data: tickets } = await supabase
      .from("tickets")
      .select("event_id, status, payment_status, ticket_type:ticket_types(price)")
      .in("event_id", ids);
    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("event_id")
      .in("event_id", ids);

    const agg = new Map<string, { reserved: number; paid: number; pending: number; collected: number; pendingRevenue: number; checkedIn: number }>();
    for (const t of tickets ?? []) {
      const a =
        agg.get(t.event_id) ?? { reserved: 0, paid: 0, pending: 0, collected: 0, pendingRevenue: 0, checkedIn: 0 };
      if (t.status !== "cancelled") {
        a.reserved += 1;
        const price = Number((t.ticket_type as { price: number } | null)?.price ?? 0);
        if (t.payment_status === "paid") {
          a.paid += 1;
          a.collected += price;
        } else if (t.payment_status === "unpaid") {
          a.pending += 1;
          a.pendingRevenue += price;
        }
      }
      agg.set(t.event_id, a);
    }
    for (const c of checkIns ?? []) {
      const a = agg.get(c.event_id);
      if (a) a.checkedIn += 1;
    }

    return events.map((e) => ({
      ...e,
      starts_at: e.starts_at as unknown as string,
      reserved: agg.get(e.id)?.reserved ?? 0,
      paid: agg.get(e.id)?.paid ?? 0,
      pending: agg.get(e.id)?.pending ?? 0,
      collected: agg.get(e.id)?.collected ?? 0,
      pendingRevenue: agg.get(e.id)?.pendingRevenue ?? 0,
      checkedIn: agg.get(e.id)?.checkedIn ?? 0,
    }));
  });

export type OrganizerEventRow = Awaited<ReturnType<typeof getOrganizerDashboard>>[number];

export const getEventManage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ eventId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertStaff(supabase, userId);

    const { data: ev } = await supabase.from("events").select("*").eq("id", data.eventId).maybeSingle();
    if (!ev) throw new Error("Event not found");
    const { data: types } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", ev.id)
      .order("price");
    const { data: tickets } = await supabase
      .from("tickets")
      .select(
        "id, ticket_code, holder_name, holder_student_id, seat, status, payment_status, created_at, verified_at, ticket_type:ticket_types(name, price)",
      )
      .eq("event_id", ev.id)
      .order("created_at", { ascending: false });
    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("id, check_in_at, method, ticket:tickets(ticket_code, holder_name)")
      .eq("event_id", ev.id)
      .order("check_in_at", { ascending: false })
      .limit(30);
    const { data: me } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();

    return { event: ev, ticketTypes: types ?? [], tickets: tickets ?? [], checkIns: checkIns ?? [], staffName: me?.display_name ?? "Officer" } as unknown as EventManageData;
  });

export type EventManageData = {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    event_type: string;
    category: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    capacity: number | null;
    status: string;
  };
  ticketTypes: { id: string; name: string; price: number; quota: number | null; status: string }[];
  tickets: {
    id: string;
    ticket_code: string;
    holder_name: string;
    holder_student_id: string | null;
    seat: string | null;
    status: string;
    payment_status: string;
    created_at: string;
    verified_at: string | null;
    ticket_type: { name: string; price: number } | null;
  }[];
  checkIns: {
    id: string;
    check_in_at: string;
    method: string;
    ticket: { ticket_code: string; holder_name: string } | null;
  }[];
  staffName: string;
};

/* ------------------------------------------------------------------ */
/* Public receipt verification                                         */
/* ------------------------------------------------------------------ */

export const verifyReceiptPublic = createServerFn({ method: "POST" })
  .inputValidator(z.object({ receiptNumber: z.string().max(40) }).parse)
  .handler(async ({ data }) => {
    const supa = createPublicClient();
    const { data: rows, error } = await supa.rpc("verify_receipt", {
      _receipt_number: data.receiptNumber.trim().toUpperCase(),
    });
    if (error) throw new Error(error.message);
    const row = (rows ?? [])[0] as unknown as
      | {
          receipt_number: string;
          event_title: string | null;
          ticket_type_name: string | null;
          total_amount: number;
          currency: string;
          payment_status: string | null;
          issued_at: string | null;
        }
      | undefined;
    return row ?? null;
  });
