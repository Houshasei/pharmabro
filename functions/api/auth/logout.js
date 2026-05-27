import {
  jsonResponse,
  err,
  readJSON,
  normalizeKey,
  formatKey,
  getJSON,
  corsPreflight,
} from "../../_utils.js";

export const onRequestOptions = () => corsPreflight();

export const onRequestPost = async ({ request, env }) => {
  const body = await readJSON(request);
  if (!body) return err("Invalid JSON body", 400);

  const key = formatKey(normalizeKey(body.key));
  const token = body.token;

  if (!key || !token) return err("Missing key or token", 400);

  const session = await getJSON(env.PHARMABRO_KV, `session:${key}`);
  if (session && session.token === token) {
    await env.PHARMABRO_KV.delete(`session:${key}`);
  }
  return jsonResponse({ ok: true });
};
