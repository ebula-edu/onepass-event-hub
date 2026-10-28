# OnePass Event Hub

# 🎟️ ICS Event Management System

**Real event platform built on OnePass. Free & paid tickets, 3D materialized tickets with OVI receipts, cash-based payments, admin-verified check-in.**

---

## 🔄 PART 0 — WHAT CHANGED FROM THE ORIGINAL PLAN

| Original | Revised |
|---|---|
| Online payment (GCash, Maya, bank) | **No online payment — cash only, paid in person** |
| Payment gateway integration | **Admin marks ticket as PAID manually** |
| Webhook-confirmed payments | **Officer/admin verification workflow** |
| Receipt emailed automatically | **Receipt shown as PNG / 3D OVI materialized** |
| Ticket auto-issued on payment | **Ticket issued only after admin marks PAID** |
| PCI-DSS scope | **Out of scope — no card data anywhere** |
| ~61 hrs estimate | **~52 hrs (payment gateway removed, admin verification added)** |

**Rule:** This demo proves **cash flow + admin authority + 3D materialized proof**. Not payment gateway integration.

---

## 🎯 PART 1 — WHAT IT DOES (REVISED)

A complete event management system for ICS:
- **Create events** (free, paid, members-only, public)
- **Register / reserve tickets** (with OnePass identity)
- **Cash payment** (in person, at the org office)
- **Admin marks ticket as PAID** (verification step)
- **Issue 3D materialized tickets** (with QR)
- **Issue 3D OVI receipts** (for paid events, shown as PNG or rendered OVI)
- **Check-in attendees** (QR scan, verified via OnePass)
- **Analytics** (registrations, attendance, revenue)

Built entirely on **OnePass identity** — no separate accounts, no PII leakage, no payment data.

---

## 🏛️ PART 2 — WHY THIS IS THE SECOND DEMO (REVISED)

| Reason | Why It Matters |
|---|---|
| **Real revenue use case** | Paid events need receipts — but cash-based |
| **Proves admin workflow** | Admin marks PAID → ticket released |
| **Proves 3D UX** | Materialized ticket + **OVI receipt** is a visual wow |
| **Proves QR scanning** | Uses OnePass verification |
| **Proves BPM workflows** | Event approval + payment verification |
| **Proves privacy** | No card data — nothing to leak |
| **Proves ecosystem** | Multiple apps work together |

**Rule:** First demo proves identity. Second demo proves **commerce + ecosystem + admin authority**.

---

## 🏗️ PART 3 — THREE EVENT / TICKET STATES (REVISED)

### Type 1 — Free Events

**When:** Org assemblies, orientations, free workshops, open meetups.

**Flow:**
```
[Organizer creates free event]
   ↓
[Student browses events]
   ↓
[Clicks "Register with OnePass"]
   ↓
[OnePass confirms identity]
   ↓
[Ticket issued instantly]
   ↓
[3D Ticket appears in "My Tickets"]
   ↓
[Receipt auto-generated (₱0.00) — shown as 3D OVI, status PAID]
```

**Requires:** `profile`, `email` scopes.

---

### Type 2 — Paid Events (Cash Flow)

**When:** Fundraisers, merchandise pre-orders, paid workshops, org balls.

**Flow:**
```
[Organizer creates paid event]
   ↓
[Student browses events]
   ↓
[Clicks "Reserve ticket with OnePass"]
   ↓
[OnePass confirms identity]
   ↓
[Reservation created — status: RESERVED]
   ↓
[Student pays CASH at org office]
   ↓
[Officer/Admin opens dashboard]
   ↓
[Admin marks ticket as PAID]
   ↓
[Ticket issued + Receipt generated]
   ↓
[3D Ticket appears in "My Tickets"]
   ↓
[3D OVI Receipt shown as PNG / on-screen]
```

**Requires:** `profile`, `email`, plus optional `student_id` (for member pricing).

**Key difference:** No gateway. **Admin is the source of truth.**

---

### Type 3 — Members-Only Events

**When:** Internal org events, member-exclusive workshops.

**Flow:** Same as free or paid, but requires `student_id` scope verification + membership check.

---

## 🎨 PART 4 — 3D MATERIALIZED TICKET (UNCHANGED)

### 4.1 The Visual Design

```
        ╔═══════════════════════════════════════╗
        ║                                       ║
        ║        ICS EVENTS · 2026              ║
        ║                                       ║
        ║   ┌───────────────────────────────┐   ║
        ║   │                               │   ║
        ║   │      3D TICKET STUB           │   ║
        ║   │                               │   ║
        ║   │   Eldrex Dr. Bula             │   ║
        ║   │   ICS General Assembly        │   ║
        ║   │   Nov 15, 2026 · 10:00 AM     │   ║
        ║   │   Gymnasium                   │   ║
        ║   │                               │   ║
        ║   │   SEAT: A-12                  │   ║
        ║   │   TYPE: Member                │   ║
        ║   │   STATUS: PAID ✓              │   ║
        ║   │                               ║   ║
        ║   │   [QR CODE]                   │   ║
        ║   │                               │   ║
        ║   └───────────────────────────────┘   ║
        ║                                       ║
        ║   Ticket ID: TKT-2026-A1B2C3          ║
        ║                                       ║
        ╚═══════════════════════════════════════╝
```

**Key features:**
- **3D flip animation** — front shows ticket info, back shows QR + terms
- **Material design** — soft shadows, gradient background, embossed corners
- **Dynamic color** — matches event theme
- **Reactive** — flips on tap/hover
- **Downloadable** — as PNG

### 4.2 CSS 3D Ticket (unchanged)

```css
.ticket-3d {
  perspective: 1200px;
  width: 380px;
  height: 200px;
  cursor: pointer;
}

.ticket-3d__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.ticket-3d.flipped .ticket-3d__inner {
  transform: rotateY(180deg);
}

.ticket-3d__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 16px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  background: linear-gradient(135deg, #8c1d27 0%, #5c1119 100%);
  color: white;
  padding: 24px;
}

.ticket-3d__back {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, #18181b 0%, #0a0a0b 100%);
}
```

### 4.3 Downloadable Versions

- **PNG** — high-res 3D render (only for PAID tickets)
- **No PDF** — simplified (per new rule: PNG only)
- **Apple Wallet / Google Wallet** — future
- **Add to Calendar** — .ics file (optional)

---

## 🧾 PART 5 — 3D OVI RECEIPT (REPLACES PDF RECEIPTS)

### 5.1 What is OVI?

**OVI = Optically Variable Ink** — in real life, ink that changes color when viewed from different angles (used on banknotes). Here we simulate it as a **3D materialized receipt** that:
- Shifts color as you tilt/tap
- Has embossed edges
- Uses gradient + shadow to mimic metallic print
- Renders as **PNG** (or on-screen 3D card)

### 5.2 Receipt Design (3D OVI)

```
        ╔═══════════════════════════════════════╗
        ║                                       ║
        ║   ICS EVENTS · OFFICIAL RECEIPT       ║
        ║   ─────────────────────────────       ║
        ║                                       ║
        ║   Receipt No: RCT-2026-A1B2C3D4       ║
        ║   Date: Nov 15, 2026                  ║
        ║                                       ║
        ║   Billed To:                          ║
        ║   Eldrex Dr. Bula                     ║
        ║   Student ID: 251056                  ║
        ║                                       ║
        ║   Event: ICS Fundraiser Concert       ║
        ║   Ticket Type: Member                 ║
        ║   Quantity: 1                         ║
        ║                                       ║
        ║   Total:        ₱250.00               ║
        ║   Payment:      CASH                  ║
        ║   Status:       PAID ✓                ║
        ║                                       ║
        ║   Ticket ID: TKT-2026-A1B2C3          ║
        ║   [QR CODE]                           ║
        ║                                       ║
        ║   Verify at: events.ics.org/          ║
        ║              verify/RCT-2026-A1B2C3D4 ║
        ║                                       ║
        ╚═══════════════════════════════════════╝
```

### 5.3 OVI Visual Effect (CSS)

```css
.receipt-ovi {
  position: relative;
  width: 400px;
  padding: 28px;
  border-radius: 20px;
  color: #fff;
  background: linear-gradient(
    120deg,
    #8c1d27 0%,
    #b32e3a 25%,
    #d4a017 50%,
    #b32e3a 75%,
    #8c1d27 100%
  );
  background-size: 200% 200%;
  animation: ovi-shift 6s ease-in-out infinite;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.4),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
  transition: transform 0.4s ease;
}

.receipt-ovi:hover {
  transform: rotateY(-8deg) rotateX(4deg) scale(1.02);
}

@keyframes ovi-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.receipt-ovi::before {
  content: "";
  position: absolute;
  inset: 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}
```

### 5.4 Receipt Features (Revised)

| Feature | Status |
|---|---|
| Auto-generated on admin PAID mark | ✅ |
| Unique receipt number (RCT-YYYY-XXXX) | ✅ |
| HMAC-signed | ✅ |
| Shown as 3D OVI on-screen | ✅ |
| Downloadable as PNG | ✅ |
| Public verification URL | ✅ |
| Email delivery | ❌ Removed (no email automation for receipts) |
| PDF | ❌ Removed |

### 5.5 Receipt Verification

Public URL: `events.ics.org/verify/RCT-2026-A1B2C3D4`

Shows:
- ✓ Valid receipt
- Event name
- Ticket type
- Amount
- Date issued
- (No PII)

---

## 🏗️ PART 6 — ARCHITECTURE (REVISED)

```
┌──────────────────────────────────────────────────────────┐
│              ICS EVENT MANAGEMENT SYSTEM                 │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐                 │
│  │  Organizer UI  │  │  Attendee UI   │                 │
│  │  (Create event,│  │  (Browse events│                 │
│  │   dashboard,   │  │   My tickets)  │                 │
│  │   mark PAID)   │  │                │                 │
│  └────────┬───────┘  └────────┬───────┘                 │
│           │                    │                        │
│           ▼                    ▼                        │
│  ┌──────────────────────────────────────┐               │
│  │  Events App (Laravel + Livewire)     │               │
│  └──────────────────┬───────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐              │
│  │ OnePass │  │  Admin   │  │  Receipt   │              │
│  │ (OAuth) │  │  PAID    │  │  Generator │              │
│  │         │  │  Marker  │  │  (OVI/PNG) │              │
│  └─────────┘  └──────────┘  └────────────┘              │
│                                                          │
│  Own DB: events, tickets, receipts, payments (cash)      │
└──────────────────────────────────────────────────────────┘
```

**Rules:**
- ✅ Own DB — never touches OnePass data
- ✅ **No payment gateway** — cash only
- ✅ **Admin is source of truth** for PAID status
- ✅ OnePass for identity only
- ✅ Receipts signed with HMAC

---

## 🗄️ PART 7 — DATA MODEL (REVISED)

```sql
-- Events (unchanged)
CREATE TABLE events (
  id UUID PRIMARY KEY,
  organizer_id UUID NOT NULL,
  organizer_role TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,                -- free | paid | member_only | public
  category TEXT,
  cover_image_url TEXT,
  location TEXT,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,
  capacity INT,
  status TEXT DEFAULT 'draft',             -- draft | pending_review | published | cancelled | completed
  approval_workflow_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_organizer ON events(organizer_id, created_at DESC);
CREATE INDEX idx_events_status ON events(status, starts_at);

-- Ticket types (unchanged)
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PHP',
  max_per_user INT DEFAULT 5,
  quota INT,
  sales_start TIMESTAMP,
  sales_end TIMESTAMP,
  scopes_required JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_types_event ON ticket_types(event_id, status);

-- Tickets (REVISED — added payment_status, verified_by)
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  ticket_code TEXT UNIQUE NOT NULL,        -- TKT-2026-A1B2C3
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  holder_id UUID NOT NULL,
  holder_name TEXT NOT NULL,
  holder_email TEXT NOT NULL,
  holder_student_id TEXT,
  seat TEXT,
  qr_payload TEXT NOT NULL,
  qr_signature TEXT NOT NULL,
  status TEXT DEFAULT 'active',            -- active | used | cancelled
  payment_status TEXT DEFAULT 'unpaid',    -- unpaid | paid | refunded  ← NEW
  verified_by UUID,                        -- admin/officer OnePass ID   ← NEW
  verified_at TIMESTAMP,                   -- when marked PAID           ← NEW
  issued_at TIMESTAMP,                     -- set when PAID              ← NEW
  used_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_event ON tickets(event_id, status);
CREATE INDEX idx_tickets_holder ON tickets(holder_id, issued_at DESC);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_payment ON tickets(payment_status, verified_at);
CREATE INDEX idx_tickets_used ON tickets(event_id, used_at)
  WHERE status = 'used';

-- Payments (REVISED — cash only, manual verification)
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                   -- OnePass user ID
  event_id UUID REFERENCES events(id),
  ticket_id UUID REFERENCES tickets(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'PHP',
  payment_method TEXT NOT NULL DEFAULT 'cash',   -- cash only now
  or_number TEXT,                          -- Official Receipt number (physical)
  received_by UUID,                        -- admin/officer OnePass ID
  status TEXT DEFAULT 'pending',           -- pending | paid | refunded
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_event ON payments(event_id, status);
CREATE INDEX idx_payments_ticket ON payments(ticket_id);

-- Receipts (REVISED — no PDF, PNG + OVI only)
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,     -- RCT-2026-A1B2C3D4
  user_id UUID NOT NULL,
  event_id UUID REFERENCES events(id),
  ticket_id UUID REFERENCES tickets(id),
  payment_id UUID REFERENCES payments(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'PHP',
  line_items JSONB NOT NULL,
  hmac_signature TEXT NOT NULL,
  png_url TEXT,                            -- generated PNG  ← NEW
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receipts_user ON receipts(user_id, created_at DESC);
CREATE INDEX idx_receipts_number ON receipts(receipt_number);

-- Check-ins (unchanged)
CREATE TABLE check_ins (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id),
  scanned_by UUID,
  check_in_at TIMESTAMP NOT NULL,
  method TEXT NOT NULL,
  metadata JSONB
);

CREATE INDEX idx_check_ins_event ON check_ins(event_id, check_in_at DESC);
```

**Key changes:**
- `tickets.payment_status` — `unpaid` | `paid` | `refunded`
- `tickets.verified_by` + `verified_at` — audit trail for admin PAID marking
- `tickets.issued_at` — set only when PAID
- `payments` — cash only, `or_number`, `received_by`, `notes`
- `receipts.png_url` — replaces `pdf_url` and `emailed_at`

---

## 🎨 PART 8 — ORGANIZER UI (REVISED)

### 8.1 Organizer Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  ICS Events                                 [+ New Event]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Active Events]                                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ICS General Assembly 2026                             │  │
│  │  Nov 15 · Free · Gymnasium                             │  │
│  │  Registered: 187 / 300                                 │  │
│  │  [ Manage ]  [ Scan Check-in ]  [ View Analytics ]      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ICS Fundraiser Concert                                │  │
│  │  Nov 20 · ₱250 · Auditorium                            │  │
│  │  Reserved: 142 · PAID: 88 · Pending: 54                │  │
│  │  Revenue (collected): ₱22,000                          │  │
│  │  [ Manage ]  [ Mark PAID ]  [ Scan ]  [ Analytics ]     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Drafts]                                                    │
│  [Past Events]                                               │
│  [Analytics]                                                 │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Mark PAID Flow (NEW — Critical)

```
┌──────────────────────────────────────────────────────────────┐
│  ICS Fundraiser Concert — Pending Payments (54)              │
├──────────────────────────────────────────────────────────────┤
│  Search: [Eldrex_______________________]  [Scan QR]           │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TKT-2026-A1B2C3                                       │  │
│  │  Eldrex Dr. Bula · 251056                              │  │
│  │  Member · ₱250 · Reserved Nov 10, 2026                 │  │
│  │  [ Verify PAID ]  [ Cancel ]                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TKT-2026-A1B2C4                                       │  │
│  │  Renzo De Villa · 251057                               │  │
│  │  Non-member · ₱350 · Reserved Nov 10, 2026             │  │
│  │  [ Verify PAID ]  [ Cancel ]                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

[Click "Verify PAID"]
   ↓
┌──────────────────────────────────────────────────────────────┐
│  Mark as PAID                                                │
├──────────────────────────────────────────────────────────────┤
│  Ticket: TKT-2026-A1B2C3                                     │
│  Amount: ₱250.00                                             │
│                                                              │
│  OR Number (optional):                                       │
│  [OR-2026-00123______________________]                       │
│                                                              │
│  Cash received by:                                           │
│  [Officer Name — auto-filled from OnePass]                   │
│                                                              │
│  Notes:                                                      │
│  [_____________________________________]                     │
│                                                              │
│  [ Cancel ]  [ Confirm PAID ]                                │
└──────────────────────────────────────────────────────────────┘
   ↓
[Ticket issued · Receipt generated · OVI receipt shown · PNG downloadable]
```

**Rule:** Only admins/officers with role permission can mark PAID. Every action audited.

### 8.3 Event Approval Workflow (unchanged)

```
[Organizer submits event]
   ↓
[Officer review — category, capacity, pricing]
   ├─ Approve → Published
   ├─ Reject → Organizer notified
   └─ Escalate → Admin review
   ↓
[Event published]
```

### 8.4 Live Check-In (unchanged)

```
┌──────────────────────────────────────────────────────────────┐
│  ICS General Assembly 2026                                   │
│  ● LIVE · 142 checked in / 187 registered                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ Camera Scanner ]  [ Manual Entry ]                        │
│                                                              │
│  Recent check-ins:                                           │
│  ✓ Eldrex Bula — 10:03 AM                                    │
│  ✓ Renzo De Villa — 10:04 AM                                 │
│                                                              │
│  Alerts:                                                     │
│  • Duplicate scan detected (TKT-2026-A1B2C3)                 │
│  • UNPAID ticket scanned — entry denied                      │
│                                                              │
│  [ Export list ]  [ End event ]                              │
└──────────────────────────────────────────────────────────────┘
```

**New rule:** Unpaid tickets **cannot check in** — scanner rejects them.

---

## 👨‍🎓 PART 9 — ATTENDEE UI (REVISED)

### 9.1 Browse Events (unchanged)

```
┌──────────────────────────────────────────────────────────────┐
│  ICS Events                                       [Search...] │
├──────────────────────────────────────────────────────────────┤
│  [ All ] [ Free ] [ Paid ] [ Members only ]                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [Cover Image]                                         │  │
│  │  ICS Fundraiser Concert                                │  │
│  │  Nov 20 · ₱250 · Auditorium                            │  │
│  │  142 reserved · 58 tickets left                        │  │
│  │  [ Reserve ticket with OnePass ]  ← RELABELED           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Reservation Flow (Paid — REVISED)

```
[Click "Reserve ticket with OnePass"]
   ↓
[Sign in with OnePass — or silent if already signed in]
   ↓
[Select ticket type: Member ₱250 / Non-member ₱350]
   ↓
[Confirm with OnePass]
   ↓
[Reservation created — status: RESERVED / UNPAID]
   ↓
[Screen shows:]
   "Your ticket is reserved. Please pay CASH at the ICS office
    to complete your purchase. Show this QR code to the officer."
   ↓
[Show reservation QR / reference]
   ↓
[Student pays cash at office]
   ↓
[Officer marks PAID in dashboard]
   ↓
[Ticket issued · Receipt generated · 3D Ticket appears]
   ↓
[Push / in-app notification: "Your ticket is now PAID ✓"]
```

**Key difference:** No payment gateway. The student leaves the app to pay cash, then comes back to find their ticket issued.

### 9.3 My Tickets (REVISED — shows payment status)

```
┌──────────────────────────────────────────────────────────────┐
│  My Tickets                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Upcoming]                                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        [3D TICKET — tap to flip]                       │  │
│  │                                                        │  │
│  │        ICS Fundraiser Concert                          │  │
│  │        Nov 20, 2026 · 7:00 PM                          │  │
│  │        Seat: A-12 · Member                             │  │
│  │        STATUS: PAID ✓                                  │  │
│  │                                                        │  │
│  │        Ticket ID: TKT-2026-A1B2C3                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [ Download Ticket PNG ]  [ View OVI Receipt ]  [ Add to Calendar ] │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        ⏳ RESERVATION PENDING PAYMENT                  │  │
│  │                                                        │  │
│  │        ICS Fundraiser Concert                          │  │
│  │        Amount: ₱250 · Pay at ICS office                │  │
│  │                                                        │  │
│  │        Reservation: RSV-2026-X9Y8Z7                    │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Past]                                                      │
│  [Cancelled]                                                 │
└──────────────────────────────────────────────────────────────┘
```

### 9.4 OVI Receipt View (NEW)

```
┌──────────────────────────────────────────────────────────────┐
│  Receipt — RCT-2026-A1B2C3D4                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│        [ 3D OVI RECEIPT — tilt/scroll to see color shift ]   │
│        ╔═══════════════════════════════════════╗             │
│        ║                                       ║             │
│        ║   ICS EVENTS · OFFICIAL RECEIPT       ║             │
│        ║   Receipt No: RCT-2026-A1B2C3D4       ║             │
│        ║   Amount: ₱250.00 · CASH · PAID ✓     ║             │
│        ║                                       ║             │
│        ╚═══════════════════════════════════════╝             │
│                                                              │
│  [ Download PNG ]  [ Verify online ]                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 PART 10 — INTEGRATION WITH ONEPASS (REVISED)

### 10.1 Scopes

| Scope | Purpose | Required |
|---|---|---|
| `openid` | Identify user | ✅ |
| `profile` | Name for ticket | ✅ |
| `email` | Receipt delivery | ✅ |
| `student_id` | Member discount verification | ⚪ |
| `contact` | (Removed — no payment contact needed) | ❌ |

### 10.2 Auth Flows

**Organizer Sign-In:**
- Standard "Sign in with OnePass"
- Officer role passed via `officer.role` scope

**Attendee Reservation:**
- Silent sign-in if already authenticated
- Consent screen on first reservation
- One-time consent per event

**Admin PAID Marking:**
- Requires `officer.role` with `events.verify_payment` permission
- Every action audited (who, when, ticket, amount)

**Check-In Scanner:**
- Verification only mode (no consent)
- QR contains signed payload
- Offline-capable

### 10.3 Admin Permission Matrix (NEW)

| Action | Student | Officer | Admin |
|---|---|---|---|
| Reserve ticket | ✅ | ✅ | ✅ |
| Mark PAID (own ticket) | ❌ | ❌ | ❌ |
| Mark PAID (any ticket) | ❌ | ✅ | ✅ |
| Create event | ❌ | ✅ | ✅ |
| Approve event | ❌ | ✅ | ✅ |
| Cancel ticket | ❌ | ✅ | ✅ |
| Issue refund | ❌ | ❌ | ✅ |
| View analytics | ❌ | ✅ (own events) | ✅ (all) |

---

## 🔒 PART 11 — SECURITY & PRIVACY (REVISED)

### 11.1 Cash Payment Security

| Rule | Enforced |
|---|---|
| No card data stored | ✅ (no cards at all) |
| PAID marking audited | ✅ |
| OR number recorded | ✅ |
| Refunds audited | ✅ |
| No PII in payment logs | ✅ |
| Only authorized roles mark PAID | ✅ |
| Unpaid tickets cannot check in | ✅ |

### 11.2 Ticket Security (unchanged)

| Rule | Enforced |
|---|---|
| Ticket codes unique | ✅ |
| QR signed with HMAC | ✅ |
| QR verifiable offline | ✅ |
| Duplicate check-in prevented | ✅ |
| Ticket transfer requires approval | ✅ |
| Ticket cancellation audited | ✅ |

### 11.3 Privacy (unchanged)

| Rule | Enforced |
|---|---|
| No PII stored beyond consent | ✅ |
| Attendee sees own data only | ✅ |
| Organizer sees consented data | ✅ |
| Anonymous check-in supported | ✅ |
| Data deletion supported | ✅ |
| Retention: 2 years | ✅ |

---

## 🎨 PART 12 — TECH STACK (REVISED)

| Layer | Tech |
|---|---|
| Framework | Laravel 12 |
| UI | Livewire + Blade + Tailwind |
| 3D Tickets + OVI Receipts | CSS 3D transforms + gradients |
| PNG generation | Browsershot / `spatie/browsershot` |
| QR | `simplesoftwareio/simple-qrcode` |
| **Payment** | **None — cash only** |
| DB | Supabase Postgres |
| Auth | Sign in with OnePass |
| Email | Resend (transactional only — ticket notification, not receipts) |
| Deploy | Render |
| Repo | `github.com/icsofficial/events` |

---

## 🧪 PART 13 — TESTS (REVISED)

### Events
- [ ] `test_organizer_can_create_event`
- [ ] `test_event_requires_workflow_approval`
- [ ] `test_event_published_after_approval`
- [ ] `test_event_capacity_enforced`

### Free Ticket Flow
- [ ] `test_user_can_register_free_event`
- [ ] `test_ticket_issued_instantly`
- [ ] `test_receipt_generated_for_free`
- [ ] `test_free_ticket_payment_status_is_paid`

### Paid Ticket Flow (REVISED — cash)
- [ ] `test_user_can_reserve_paid_ticket`
- [ ] `test_reservation_creates_unpaid_ticket`
- [ ] `test_unpaid_ticket_cannot_check_in`
- [ ] `test_admin_can_mark_ticket_paid`
- [ ] `test_ticket_issued_only_after_paid`
- [ ] `test_receipt_generated_after_paid`
- [ ] `test_officer_role_required_to_mark_paid`
- [ ] `test_paid_marking_audited`
- [ ] `test_refund_flow`
- [ ] `test_or_number_recorded`

### 3D Tickets
- [ ] `test_3d_ticket_renders`
- [ ] `test_ticket_png_downloadable`
- [ ] `test_ticket_qr_verifiable`

### OVI Receipts (REVISED)
- [ ] `test_receipt_generated`
- [ ] `test_receipt_png_downloadable`
- [ ] `test_receipt_hmac_signed`
- [ ] `test_receipt_verifiable_publicly`
- [ ] `test_ovi_animation_renders`

### Check-In
- [ ] `test_qr_scan_works`
- [ ] `test_duplicate_check_in_prevented`
- [ ] `test_offline_check_in_works`
- [ ] `test_check_in_with_anonymous_mode`
- [ ] `test_unpaid_ticket_rejected_at_scan`

### Privacy
- [ ] `test_no_pii_in_payment_logs`
- [ ] `test_attendee_sees_own_tickets_only`
- [ ] `test_data_deletion_supported`


## ✅ PART 15 — MASTER CHECKLIST (REVISED)

### Core
- [ ] App registered in Dev Console
- [ ] OIDC enabled
- [ ] Scopes approved
- [ ] Sign in with OnePass works
- [ ] Own DB set up

### Events
- [ ] Create / edit / delete
- [ ] Categories
- [ ] Cover images
- [ ] Capacity limits
- [ ] Workflow approval
- [ ] Status: draft → pending → published → completed

### Tickets
- [ ] Free registration
- [ ] **Paid reservation (unpaid)**
- [ ] **Admin mark PAID**
- [ ] **Ticket issued only after PAID**
- [ ] Ticket types (Member, Non-member, VIP)
- [ ] 3D materialized design
- [ ] QR signed
- [ ] **PNG download**
- [ ] Email notification (not receipt)

### Cash Payments
- [ ] Cash only
- [ ] **OR number recorded**
- [ ] **Received by (officer audit)**
- [ ] **Notes**
- [ ] Refunds audited
- [ ] No card data stored

### Receipts (REVISED)
- [ ] Auto-generated on PAID mark
- [ ] Unique number
- [ ] HMAC-signed
- [ ] **3D OVI on-screen**
- [ ] **PNG download**
- [ ] Public verification

### Check-In
- [ ] QR scan
- [ ] Manual entry
- [ ] Duplicate prevention
- [ ] Offline capable
- [ ] Anonymous mode
- [ ] **Unpaid ticket rejection**

### Analytics
- [ ] Registrations
- [ ] **Paid vs. unpaid breakdown**
- [ ] Check-ins
- [ ] **Revenue (collected vs. pending)**
- [ ] Trends
- [ ] Export

### Privacy
- [ ] No PII beyond consent
- [ ] Own data only
- [ ] Deletion supported
- [ ] Retention policy

## 🏁 ONE-LINE SUMMARY (REVISED)

> **ICS Events is the second official tool on OnePass — free and paid events, 3D materialized tickets, cash-based payments verified by admin, signed OVI receipts shown as PNG. Own DB, own repo, own deploy, built on OnePass identity. Proves the ecosystem works end-to-end — no online payment, no card data, admin is the source of truth.**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/258b0c7e-2ac8-4652-9f71-9257ed04cff4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
