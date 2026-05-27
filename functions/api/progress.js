import {
  jsonResponse,
  err,
  readJSON,
  normalizeKey,
  formatKey,
  getJSON,
  putJSON,
  corsPreflight,
} from "../_utils.js";

export const onRequestOptions = () => corsPreflight();

// GET /api/progress?key=...&token=...
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = formatKey(normalizeKey(url.searchParams.get("key") || ""));
  const token = url.searchParams.get("token") || "";

  if (!key || !token) return err("Missing key or token", 400);

  const session = await getJSON(env.PHARMABRO_KV, `session:${key}`);
  if (!session || session.token !== token) {
    return err("Session expired", 401);
  }

  const progress = (await getJSON(env.PHARMABRO_KV, `progress:${key}`)) || {
    player: null,
    sessions: {},
    updatedAt: 0,
  };

  return jsonResponse({ ok: true, progress });
};

// POST /api/progress  body: {key, token, progress}
// We store the latest snapshot. The client owns conflict resolution
// (last-write-wins; updatedAt is included for client to decide).
export const onRequestPost = async ({ request, env }) => {
  const body = await readJSON(request);
  if (!body) return err("Invalid JSON body", 400);

  const key = formatKey(normalizeKey(body.key));
  const token = body.token;
  if (!key || !token) return err("Missing key or token", 400);
  if (!body.progress || typeof body.progress !== "object") {
    return err("Missing progress payload", 400);
  }

  const session = await getJSON(env.PHARMABRO_KV, `session:${key}`);
  if (!session || session.token !== token) {
    return err("Session expired", 401);
  }

  const value = {
    player: body.progress.player ?? null,
    sessions: body.progress.sessions ?? {},
    updatedAt: Date.now(),
  };

  // Roughly cap the size to avoid abuse — 1MB is plenty for quiz progress
  const json = JSON.stringify(value);
  if (json.length > 1_000_000) return err("Progress payload too large", 413);

  await env.PHARMABRO_KV.put(`progress:${key}`, json);
  return jsonResponse({ ok: true, updatedAt: value.updatedAt });
};
