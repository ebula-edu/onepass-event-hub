# ICS Events — build roadmap

## Done
- [x] Lovable Cloud enabled, email auth on
- [x] Schema migration: events, ticket_types, tickets, payments, receipts, check_ins, profiles, user_roles, has_role, verify_receipt
- [x] Public RPC reads: list_published_events, get_event_by_slug
- [x] Seed demo data (personas, events, tickets, payments, receipts)
- [x] Design system (Crimson & Gold, 3D ticket + OVI receipt CSS)
- [x] Server functions (reserve, markPaid, cancel, refund, check-in, dashboards, verify)
- [x] Shared components (header, event card, 3D ticket, OVI receipt, reservation card)

## In progress
- [ ] Routes: index, event/$slug, auth (OnePass mock), my-tickets, receipts/$number, organizer index/new/$eventId, verify/$number
- [ ] Root: fonts, Toaster, auth state listener
- [ ] Tests for core rules (unpaid check-in rejection, HMAC, formats)

## Backlog
- [ ] Playwright end-to-end pass of the full flows
- [ ] AGENTS.md architecture notes
