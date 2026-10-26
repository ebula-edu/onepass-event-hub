-- Public, PII-free event reads for SSR (security definer RPCs)

create or replace function public.list_published_events()
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  event_type text,
  category text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  reserved_count bigint,
  paid_count bigint,
  tickets_left bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.title, e.slug, e.description, e.event_type, e.category, e.location,
         e.starts_at, e.ends_at, e.capacity,
         (select count(*) from public.tickets t where t.event_id = e.id and t.status <> 'cancelled'),
         (select count(*) from public.tickets t where t.event_id = e.id and t.payment_status = 'paid' and t.status <> 'cancelled'),
         greatest(coalesce(e.capacity, 0) - (select count(*) from public.tickets t where t.event_id = e.id and t.status <> 'cancelled'), 0)
  from public.events e
  where e.status = 'published'
  order by e.starts_at asc;
$$;

create or replace function public.get_event_by_slug(_slug text)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  event_type text,
  category text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  reserved_count bigint,
  paid_count bigint,
  tickets_left bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.title, e.slug, e.description, e.event_type, e.category, e.location,
         e.starts_at, e.ends_at, e.capacity,
         (select count(*) from public.tickets t where t.event_id = e.id and t.status <> 'cancelled'),
         (select count(*) from public.tickets t where t.event_id = e.id and t.payment_status = 'paid' and t.status <> 'cancelled'),
         greatest(coalesce(e.capacity, 0) - (select count(*) from public.tickets t where t.event_id = e.id and t.status <> 'cancelled'), 0)
  from public.events e
  where e.slug = _slug and e.status = 'published';
$$;

grant execute on function public.list_published_events() to anon, authenticated;
grant execute on function public.get_event_by_slug(text) to anon, authenticated;
