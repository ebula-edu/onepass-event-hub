/**
 * HMAC signing for ticket QR payloads and receipts.
 *
 * The demo key matches the one baked into the seed migration so seeded
 * tickets/receipts verify. TICKET_HMAC_SECRET overrides it in any real
 * deployment. Server-side only — never import from a client component.
 */

export const DEMO_HMAC_KEY = "ics_ovi_hmac_demo_key_v1";

function hmacSecret(): string {
  if (typeof process !== "undefined") {
    return process.env?.["TICKET_HMAC_SECRET"] || DEMO_HMAC_KEY;
  }
  return DEMO_HMAC_KEY;
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(hmacSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function signHmac(payload: string): Promise<string> {
  const key = await importKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyHmac(payload: string, signature: string): Promise<boolean> {
  const expected = await signHmac(payload);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.toLowerCase().charCodeAt(i);
  }
  return diff === 0;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomSuffix(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function newTicketCode(): string {
  return `TKT-${new Date().getFullYear()}-${randomSuffix(6)}`;
}

export function newReceiptNumber(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `RCT-${new Date().getFullYear()}-${hex}`;
}
