import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createEvent } from "@/lib/server/ics.functions";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { peso } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/organizer/new")({
  head: () => ({
    meta: [
      { title: "New Event — ICS Events" },
      { name: "description", content: "Create a free, paid or members-only ICS event." },
      { property: "og:title", content: "New Event — ICS Events" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewEventPage,
});

type TicketTypeDraft = { name: string; price: number; quota: string };

function NewEventPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"free" | "paid" | "member_only">("free");
  const [category, setCategory] = useState("Assembly");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [submitForReview, setSubmitForReview] = useState(true);
  const [types, setTypes] = useState<TicketTypeDraft[]>([{ name: "General Admission", price: 0, quota: "100" }]);

  const create = useMutation({
    mutationFn: () =>
      createEvent({
        data: {
          title,
          description: description || null,
          eventType,
          category,
          location: location || null,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          capacity: capacity ? Number(capacity) : null,
          ticketTypes: types.map((t) => ({
            name: t.name,
            price: Number(t.price) || 0,
            quota: t.quota ? Number(t.quota) : null,
            description: null,
          })),
          submitForReview,
        },
      }),
    onSuccess: (ev) => {
      toast.success(`Event "${ev.title}" ${submitForReview ? "submitted for review" : "saved as draft"}`);
      void navigate({ to: "/organizer" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function updateType(index: number, patch: Partial<TicketTypeDraft>) {
    setTypes((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <h1 className="mt-8 font-display text-3xl">New Event</h1>
      <p className="text-sm text-muted-foreground">Free events issue tickets instantly; paid events use cash + officer verification.</p>

      <Card className="mt-6 space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Event title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ICS General Assembly 2027" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happens at this event?" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={eventType} onChange={(e) => setEventType(e.target.value as typeof eventType)}>
              <option value="free">Free</option>
              <option value="paid">Paid (cash)</option>
              <option value="member_only">Members only</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Assembly" />
          </div>
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min={1} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Gymnasium" />
          </div>
          <div className="space-y-1.5">
            <Label>Starts at</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ends at (optional)</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ticket types</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTypes((p) => [...p, { name: "", price: eventType === "paid" ? 250 : 0, quota: "" }])}
            >
              <Plus className="size-4" /> Add type
            </Button>
          </div>
          {types.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_90px_36px] items-end gap-2">
              <div className="space-y-1">
                {i === 0 && <Label className="text-xs">Name</Label>}
                <Input value={t.name} onChange={(e) => updateType(i, { name: e.target.value })} placeholder="Member" />
              </div>
              <div className="space-y-1">
                {i === 0 && <Label className="text-xs">Price (₱)</Label>}
                <Input type="number" min={0} value={t.price} onChange={(e) => updateType(i, { price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                {i === 0 && <Label className="text-xs">Quota</Label>}
                <Input type="number" min={1} value={t.quota} onChange={(e) => updateType(i, { quota: e.target.value })} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                disabled={types.length === 1}
                onClick={() => setTypes((p) => p.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {eventType === "paid" && (
            <p className="text-xs text-muted-foreground">
              Example: Member {peso(250)} / Non-member {peso(350)} — attendees pay cash at the ICS office.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={submitForReview}
            onChange={(e) => setSubmitForReview(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Submit for officer approval (otherwise saved as draft)
        </label>

        <Button className="w-full" size="lg" disabled={create.isPending || !title || !startsAt} onClick={() => create.mutate()}>
          {create.isPending ? "Creating…" : "Create event"}
        </Button>
      </Card>
    </div>
  );
}
