// Shared helpers for Pages Functions.

export const HEARTBEAT_TIMEOUT_MS = 60_000; // 60s — session considered stale

const JSON_HEADERS = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export function err(message, status = 400) {
  return jsonResponse({ ok: false, error: message }, status);
}

export async function readJSON(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Normalize a key submission: uppercase, strip whitespace and dashes.
export function normalizeKey(input) {
  if (!input || typeof input !== "string") return "";
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Re-insert dashes every 4 chars for storage consistency
export function formatKey(normalized) {
  if (normalized.length !== 16) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12)}`;
}

export async function getJSON(kv, key) {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function putJSON(kv, key, value, options = {}) {
  await kv.put(key, JSON.stringify(value), options);
}

export function isSessionFresh(session, now = Date.now()) {
  return !!session && (now - (session.lastSeen || 0)) < HEARTBEAT_TIMEOUT_MS;
}
