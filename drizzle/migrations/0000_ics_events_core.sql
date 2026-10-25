-- ============================================================
-- ICS EVENTS — core schema, RLS, demo seed (OnePass demo personas)
-- ============================================================

create type public.app_role as enum ('admin', 'officer', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  student_id text,
  email text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null,
  organizer_role text,
  title text not null,
  slug text unique not null,
  description text,
  event_type text not null check (event_type in ('free','paid','member_only')),
  category text,
  cover_image_url text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  status text not null default 'draft' check (status in ('draft','pending_review','published','cancelled','completed')),
  created_at timestamptz not null default now()
);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  currency text not null default 'PHP',
  max_per_user integer default 5,
  quota integer,
  scopes_required jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text unique not null,
  event_id uuid references public.events(id) on delete cascade not null,
  ticket_type_id uuid references public.ticket_types(id),
  holder_id uuid not null,
  holder_name text not null,
  holder_email text not null,
  holder_student_id text,
  seat text,
  qr_payload text not null,
  qr_signature text not null,
  status text not null default 'active' check (status in ('active','used','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  verified_by uuid,
  verified_at timestamptz,
  issued_at timestamptz,
  used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_id uuid references public.events(id),
  ticket_id uuid references public.tickets(id),
  amount numeric(10,2) not null,
  currency text not null default 'PHP',
  payment_method text not null default 'cash',
  or_number text,
  received_by uuid,
  status text not null default 'pending' check (status in ('pending','paid','refunded')),
  paid_at timestamptz,
  refunded_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text unique not null,
  user_id uuid not null,
  event_id uuid references public.events(id),
  ticket_id uuid references public.tickets(id),
  payment_id uuid references public.payments(id),
  total_amount numeric(10,2) not null,
  currency text not null default 'PHP',
  line_items jsonb not null default '[]'::jsonb,
  hmac_signature text not null,
  created_at timestamptz not null default now()
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  ticket_id uuid references public.tickets(id),
  scanned_by uuid,
  check_in_at timestamptz not null default now(),
  method text not null default 'qr',
  metadata jsonb not null default '{}'::jsonb
);

-- indexes
create index idx_events_organizer on public.events(organizer_id, created_at desc);
create index idx_events_status on public.events(status, starts_at);
create index idx_ticket_types_event on public.ticket_types(event_id, status);
create index idx_tickets_event on public.tickets(event_id, status);
create index idx_tickets_holder on public.tickets(holder_id, issued_at desc);
create index idx_tickets_payment on public.tickets(payment_status, verified_at);
create index idx_payments_user on public.payments(user_id, created_at desc);
create index idx_payments_event on public.payments(event_id, status);
create index idx_payments_ticket on public.payments(ticket_id);
create index idx_receipts_user on public.receipts(user_id, created_at desc);
create index idx_check_ins_event on public.check_ins(event_id, check_in_at desc);

-- ============================================================
-- Role helper (security definer, avoids RLS recursion)
-- ============================================================
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- ============================================================
-- Auto profile + student role on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, student_id, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'student_id',
    new.email
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- Public receipt verification (no PII)
-- ============================================================
create or replace function public.verify_receipt(_receipt_number text)
returns table (
  receipt_number text,
  event_title text,
  ticket_type_name text,
  total_amount numeric,
  currency text,
  payment_status text,
  issued_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.receipt_number, e.title, tt.name, r.total_amount, r.currency,
         t.payment_status, r.created_at
  from public.receipts r
  left join public.tickets t on t.id = r.ticket_id
  left join public.ticket_types tt on tt.id = t.ticket_type_id
  left join public.events e on e.id = r.event_id
  where r.receipt_number = _receipt_number;
$$;

-- ============================================================
-- GRANTS
-- ============================================================
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
grant select on public.ticket_types to anon;
grant select, insert, update, delete on public.ticket_types to authenticated;
grant all on public.ticket_types to service_role;
grant select, insert, update, delete on public.tickets to authenticated;
grant all on public.tickets to service_role;
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
grant select on public.receipts to authenticated;
grant all on public.receipts to service_role;
grant select on public.check_ins to authenticated;
grant all on public.check_ins to service_role;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.verify_receipt(text) to anon, authenticated;

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;
alter table public.tickets enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;
alter table public.check_ins enable row level security;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "Anyone can view published events"
  on public.events for select to anon, authenticated
  using (status = 'published');

create policy "Organizers can view own events"
  on public.events for select to authenticated
  using (organizer_id = auth.uid());

create policy "Staff can view all events"
  on public.events for select to authenticated
  using (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

create policy "Officers and admins create events"
  on public.events for insert to authenticated
  with check (organizer_id = auth.uid() and (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin')));

create policy "Organizers and staff update events"
  on public.events for update to authenticated
  using (organizer_id = auth.uid() or public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'))
  with check (organizer_id = auth.uid() or public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

create policy "Admins delete events"
  on public.events for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Anyone can view ticket types of published events"
  on public.ticket_types for select to anon, authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.status = 'published'));

create policy "Staff and organizers view ticket types"
  on public.ticket_types for select to authenticated
  using (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin')
         or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid()));

create policy "Staff manage ticket types"
  on public.ticket_types for all to authenticated
  using (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

create policy "Holders and staff view tickets"
  on public.tickets for select to authenticated
  using (holder_id = auth.uid() or public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

create policy "Users reserve own tickets"
  on public.tickets for insert to authenticated
  with check (
    holder_id = auth.uid()
    and (
      payment_status = 'unpaid'
      or exists (select 1 from public.ticket_types tt where tt.id = ticket_type_id and tt.price = 0)
    )
  );

create policy "Staff update tickets"
  on public.tickets for update to authenticated
  using (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

create policy "Staff delete tickets"
  on public.tickets for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Owners and staff view payments"
  on public.payments for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

create policy "Owners and staff view receipts"
  on public.receipts for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

create policy "Staff view check-ins"
  on public.check_ins for select to authenticated
  using (public.has_role(auth.uid(), 'officer') or public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- DEMO SEED — OnePass demo personas (password: onepass123)
-- HMAC demo key mirrors the TICKET_HMAC_SECRET secret.
-- ============================================================
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'eldrex@onepass.demo', crypt('onepass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Eldrex Dr. Bula","student_id":"251056"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'renzo@onepass.demo', crypt('onepass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Renzo De Villa","student_id":"251057"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'mia@onepass.demo', crypt('onepass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Mia Santelices","student_id":"251058"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'josh@onepass.demo', crypt('onepass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Joshua Ramos","student_id":"251059"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'officer@onepass.demo', crypt('onepass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maria Cruz","student_id":"201401"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'admin@onepass.demo', crypt('onepass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Raul Reyes"}', now(), now());

insert into public.user_roles (user_id, role) values
  ('22222222-0000-4000-8000-000000000001', 'officer'),
  ('22222222-0000-4000-8000-000000000002', 'admin');

insert into public.events (id, organizer_id, organizer_role, title, slug, description, event_type, category, location, starts_at, ends_at, capacity, status) values
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'officer', 'ICS General Assembly 2026', 'ics-general-assembly-2026', 'Annual general assembly of the Institute of Computing Studies. Attendance is recorded — bring your OnePass.', 'free', 'Assembly', 'University Gymnasium', '2026-11-15 10:00:00+08', '2026-11-15 13:00:00+08', 300, 'published'),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'officer', 'ICS Fundraiser Concert', 'ics-fundraiser-concert', 'Live performances by ICS bands and guests. Proceeds fund the department''s outreach program. Pay cash at the ICS office to confirm your ticket.', 'paid', 'Concert', 'Main Auditorium', '2026-11-20 19:00:00+08', '2026-11-20 22:00:00+08', 250, 'published'),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'officer', 'Members-Only Dev Workshop', 'members-only-dev-workshop', 'Hands-on workshop on modern web tooling, exclusive to ICS organization members. Student ID verified at check-in.', 'member_only', 'Workshop', 'ICS Lab 301', '2026-12-05 13:00:00+08', '2026-12-05 17:00:00+08', 40, 'published'),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'officer', 'ICS Quiz Bee 2026', 'ics-quiz-bee-2026', 'Inter-section quiz bee. Draft — pending organizer edits before submission.', 'free', 'Competition', 'ICS Lecture Hall', '2026-12-10 14:00:00+08', null, 120, 'draft'),
  ('33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 'officer', 'ICS Sports Fest', 'ics-sports-fest', 'Submitted for officer review — awaiting approval.', 'free', 'Sports', ' Covered Court', '2026-12-12 08:00:00+08', null, 200, 'pending_review');

insert into public.ticket_types (id, event_id, name, description, price, max_per_user, quota, scopes_required) values
  ('44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'General Admission', 'Open to all ICS students', 0, 1, 300, '[]'::jsonb),
  ('44444444-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', 'Member', 'ICS org members', 250, 2, 150, '[]'::jsonb),
  ('44444444-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000002', 'Non-member', 'General public', 350, 2, 80, '[]'::jsonb),
  ('44444444-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000002', 'VIP', 'Front row + merch bundle', 500, 1, 20, '[]'::jsonb),
  ('44444444-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000003', 'Member Pass', 'Requires verified student ID', 0, 1, 40, '["student_id"]'::jsonb);

insert into public.tickets (id, ticket_code, event_id, ticket_type_id, holder_id, holder_name, holder_email, holder_student_id, seat, qr_payload, qr_signature, status, payment_status, verified_by, verified_at, issued_at) values
  ('55555555-0000-4000-8000-000000000001', 'TKT-2026-A1B2C3', '33333333-0000-4000-8000-000000000002', '44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001', 'Eldrex Dr. Bula', 'eldrex@onepass.demo', '251056', 'A-12', 'TKT-2026-A1B2C3', encode(hmac('TKT-2026-A1B2C3', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), 'active', 'paid', '22222222-0000-4000-8000-000000000001', '2026-11-10 15:00:00+08', '2026-11-10 15:00:00+08'),
  ('55555555-0000-4000-8000-000000000002', 'TKT-2026-A1B2C4', '33333333-0000-4000-8000-000000000002', '44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000002', 'Renzo De Villa', 'renzo@onepass.demo', '251057', 'A-13', 'TKT-2026-A1B2C4', encode(hmac('TKT-2026-A1B2C4', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), 'active', 'paid', '22222222-0000-4000-8000-000000000001', '2026-11-10 15:05:00+08', '2026-11-10 15:05:00+08'),
  ('55555555-0000-4000-8000-000000000003', 'TKT-2026-B7C8D9', '33333333-0000-4000-8000-000000000002', '44444444-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000003', 'Mia Santelices', 'mia@onepass.demo', '251058', null, 'TKT-2026-B7C8D9', encode(hmac('TKT-2026-B7C8D9', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), 'active', 'unpaid', null, null, null),
  ('55555555-0000-4000-8000-000000000004', 'TKT-2026-C4D5E6', '33333333-0000-4000-8000-000000000002', '44444444-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000004', 'Joshua Ramos', 'josh@onepass.demo', '251059', null, 'TKT-2026-C4D5E6', encode(hmac('TKT-2026-C4D5E6', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), 'active', 'unpaid', null, null, null),
  ('55555555-0000-4000-8000-000000000005', 'TKT-2026-D4E5F6', '33333333-0000-4000-8000-000000000001', '44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'Eldrex Dr. Bula', 'eldrex@onepass.demo', '251056', 'GA-041', 'TKT-2026-D4E5F6', encode(hmac('TKT-2026-D4E5F6', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), 'active', 'paid', null, null, now()),
  ('55555555-0000-4000-8000-000000000006', 'TKT-2026-E5F6A7', '33333333-0000-4000-8000-000000000001', '44444444-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000003', 'Mia Santelices', 'mia@onepass.demo', '251058', 'GA-042', 'TKT-2026-E5F6A7', encode(hmac('TKT-2026-E5F6A7', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), 'active', 'paid', null, null, now());

insert into public.payments (id, user_id, event_id, ticket_id, amount, or_number, received_by, status, paid_at, notes) values
  ('66666666-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000001', 250.00, 'OR-2026-00123', '22222222-0000-4000-8000-000000000001', 'paid', '2026-11-10 15:00:00+08', 'Paid in cash at ICS office'),
  ('66666666-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000002', 350.00, 'OR-2026-00124', '22222222-0000-4000-8000-000000000001', 'paid', '2026-11-10 15:05:00+08', 'Paid in cash at ICS office');

insert into public.receipts (id, receipt_number, user_id, event_id, ticket_id, payment_id, total_amount, line_items, hmac_signature, created_at) values
  ('77777777-0000-4000-8000-000000000001', 'RCT-2026-A1B2C3D4', '11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000001', '66666666-0000-4000-8000-000000000001', 250.00, '[{"label":"Member ticket","qty":1,"amount":250.00}]'::jsonb, encode(hmac('RCT-2026-A1B2C3D4|250.00', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), '2026-11-10 15:00:00+08'),
  ('77777777-0000-4000-8000-000000000002', 'RCT-2026-A1B2C4D5', '11111111-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000002', 350.00, '[{"label":"Non-member ticket","qty":1,"amount":350.00}]'::jsonb, encode(hmac('RCT-2026-A1B2C4D5|350.00', 'ics_ovi_hmac_demo_key_v1', 'sha256'), 'hex'), '2026-11-10 15:05:00+08');
