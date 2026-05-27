import {
  jsonResponse,
  err,
  readJSON,
  randomToken,
  normalizeKey,
  formatKey,
  getJSON,
  putJSON,
  isSessionFresh,
  corsPreflight,
} from "../../_utils.js";

export const onRequestOptions = () => corsPreflight();

export const onRequestPost = async ({ request, env }) => {
  const body = await readJSON(request);
  if (!body) return err("Invalid JSON body", 400);

  const keyNorm = normalizeKey(body.key);
  if (keyNorm.length !== 16) return err("Invalid key format", 400);
  const key = formatKey(keyNorm);

  const deviceId = (body.deviceId || "").slice(0, 64) || "unknown";

  // Validate key exists
  const meta = await getJSON(env.PHARMABRO_KV, `key:${key}`);
  if (!meta) return err("Key not recognized", 401);

  // Check active session
  const existing = await getJSON(env.PHARMABRO_KV, `session:${key}`);
  const now = Date.now();
  if (existing && isSessionFresh(existing, now) && existing.deviceId !== deviceId) {
    return err(
      `This key is currently active on another device. Try again in ~${Math.ceil(
        (60_000 - (now - existing.lastSeen)) / 1000
      )}s, or have the other device log out.`,
      409
    );
  }

  // Create or refresh session
  const token = (existing && existing.deviceId === deviceId && isSessionFresh(existing, now))
    ? existing.token
    : randomToken();

  await putJSON(
    env.PHARMABRO_KV,
    `session:${key}`,
    { token, deviceId, lastSeen: now, createdAt: existing?.createdAt || now },
    // 24-hour TTL — keeps KV clean if heartbeats stop forever
    { expirationTtl: 24 * 60 * 60 }
  );

  return jsonResponse({ ok: true, key, token, heartbeatIntervalMs: 30_000 });
};
