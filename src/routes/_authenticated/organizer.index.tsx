import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, CircleDollarSign, Plus, Users } from "lucide-react";
import {
  getOrganizerDashboard,
  reviewEvent,
  type OrganizerEventRow,
} from "@/lib/ics.functions";
import { Badge, Button, Card } from "@/components/ui";
import { eventDayLabel, peso } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/organizer/")({
  loader: async () => {
    try {
      return await getOrganizerDashboard();
    } catch {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Organizer Dashboard — ICS Events" },
      { name: "description", content: "Create events, verify cash payments, run check-in, watch analytics." },
      { property: "og:title", content: "Organizer Dashboard — ICS Events" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizerDashboard,
});

function statusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge variant="success">Published</Badge>;
    case "pending_review":
      return <Badge variant="gold">Pending review</Badge>;
    case "draft":
      return <Badge variant="outline">Draft</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "completed":
      return <Badge variant="ink">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function OrganizerDashboard() {
  const events = Route.useLoaderData() as OrganizerEventRow[];
  const queryClient = useQueryClient();

  const review = useMutation({
    mutationFn: (input: { eventId: string; action: "approve" | "reject" | "escalate" | "cancel" | "complete" }) =>
      reviewEvent({ data: input }),
    onSuccess: (res) => {
      toast.success(`Event is now ${res.status}`);
      queryClient.invalidateQueries({ queryKey: ["published-events"] });
      window.location.reload();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totals = events.reduce(
    (acc, e) => ({
      reserved: acc.reserved + e.reserved,
      pending: acc.pending + e.pending,
      collected: acc.collected + e.collected,
      pendingRevenue: acc.pendingRevenue + e.pendingRevenue,
    }),
    { reserved: 0, pending: 0, collected: 0, pendingRevenue: 0 },
  );

  const active = events.filter((e) => e.status === "published");
  const review2 = events.filter((e) => e.status === "pending_review");
  const drafts = events.filter((e) => e.status === "draft");
  const closed = events.filter((e) => e.status === "cancelled" || e.status === "completed");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Organizer Dashboard</h1>
          <p className="text-sm text-muted-foreground">Officer & admin workspace — cash is verified here.</p>
        </div>
        <Link to="/organizer/new">
          <Button>
            <Plus className="size-4" /> New Event
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5" /> Registrations</p>
          <p className="mt-1 font-display text-3xl">{totals.reserved}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CircleDollarSign className="size-3.5" /> Collected</p>
          <p className="mt-1 font-display text-3xl text-primary">{peso(totals.collected)}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> Pending payments</p>
          <p className="mt-1 font-display text-3xl text-gold-deep">{totals.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CircleDollarSign className="size-3.5" /> Pending revenue</p>
          <p className="mt-1 font-display text-3xl">{peso(totals.pendingRevenue)}</p>
        </Card>
      </div>

      <EventSection
        title="Active events"
        events={active}
        review={review}
        showReview={false}
      />
      <EventSection
        title="Awaiting approval"
        events={review2}
        review={review}
        showReview
      />
      <EventSection
        title="Drafts"
        events={drafts}
        review={review}
        showReview={false}
        submitAction
      />
      <EventSection
        title="Past & cancelled"
        events={closed}
        review={review}
        showReview={false}
      />
    </div>
  );
}

function EventSection({
  title,
  events,
  review,
  showReview,
  submitAction,
}: {
  title: string;
  events: OrganizerEventRow[];
  review: ReturnType<typeof useMutation<unknown, Error, { eventId: string; action: "approve" | "reject" | "escalate" | "cancel" | "complete" }>>;
  showReview: boolean;
  submitAction?: boolean;
}) {
  if (events.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      <div className="mt-3 space-y-3">
        {events.map((e) => (
          <Card key={e.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl">{e.title}</h3>
                  {statusBadge(e.status)}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {eventDayLabel(e.starts_at)} · {e.location} ·{" "}
                  {e.event_type === "free" ? "Free" : e.event_type === "member_only" ? "Members only" : "Paid"}
                </p>
                <p className="mt-1 text-sm">
                  Reserved: <strong>{e.reserved}</strong>
                  {e.capacity ? ` / ${e.capacity}` : ""} · PAID: <strong>{e.paid}</strong> · Pending:{" "}
                  <strong className="text-gold-deep">{e.pending}</strong> · Checked in: <strong>{e.checkedIn}</strong>
                </p>
                {e.event_type !== "free" && (
                  <p className="mt-0.5 text-sm">
                    Revenue collected: <strong className="text-primary">{peso(e.collected)}</strong> · Pending:{" "}
                    {peso(e.pendingRevenue)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {showReview && (
                  <>
                    <Button size="sm" onClick={() => review.mutate({ eventId: e.id, action: "approve" })}>
                      <CheckCircle2 className="size-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => review.mutate({ eventId: e.id, action: "reject" })}>
                      Reject
                    </Button>
                  </>
                )}
                {submitAction && (
                  <Button size="sm" variant="outline" onClick={() => review.mutate({ eventId: e.id, action: "escalate" })}>
                    Submit for review
                  </Button>
                )}
                <Link to="/organizer/$eventId" params={{ eventId: e.id }}>
                  <Button size="sm" variant="deep">Manage</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
