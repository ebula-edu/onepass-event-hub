export function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function pesoShort(amount: number): string {
  return Number.isInteger(amount) && amount !== 0
    ? `₱${amount.toLocaleString("en-PH")}`
    : peso(amount);
}

export function eventDateLabel(startsAt: string, endsAt?: string | null): string {
  const d = new Date(startsAt);
  const date = d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });
  return endsAt ? `${date} · ${time}` : `${date} · ${time}`;
}

export function eventDayLabel(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function eventTimeLabel(startsAt: string): string {
  return new Date(startsAt).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildIcsFile(opts: {
  title: string;
  location: string;
  startsAt: string;
  endsAt?: string | null;
  description?: string;
}): string {
  const dt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ICS Events//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@events.ics.org`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(opts.startsAt)}`,
    ...(opts.endsAt ? [`DTEND:${dt(opts.endsAt)}`] : []),
    `SUMMARY:${opts.title}`,
    `LOCATION:${opts.location}`,
    ...(opts.description ? [`DESCRIPTION:${opts.description}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
