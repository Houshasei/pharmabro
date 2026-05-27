// Thin client for the Pages Functions backend.
// All endpoints accept JSON and return {ok: bool, ...}.
//
// We use relative URLs so the same code works for local `npm run dev` (where
// the Worker runtime isn't running — calls 404 gracefully) and for production
// where Pages Functions serves /api/*.

const API_BASE = "/api";

async function request(path, { method = "GET", body, signal } = {}) {
  const opts = { method, signal };
  if (body !== undefined) {
    opts.headers = { "content-type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const url =
    method === "GET" && body
      ? `${API_BASE}${path}?${new URLSearchParams(body).toString()}`
      : `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    return { ok: false, error: "Network error — check your connection.", status: 0 };
  }
  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: `Bad response (${res.status})`, status: res.status };
  }
  return { ...data, status: res.status };
}

export const api = {
  login: (key, deviceId) =>
    request("/auth/login", { method: "POST", body: { key, deviceId } }),
  heartbeat: (key, token, signal) =>
    request("/auth/heartbeat", { method: "POST", body: { key, token }, signal }),
  logout: (key, token) =>
    request("/auth/logout", { method: "POST", body: { key, token } }),
  getProgress: (key, token, signal) =>
    request("/progress", { method: "GET", body: { key, token }, signal }),
  saveProgress: (key, token, progress) =>
    request("/progress", { method: "POST", body: { key, token, progress } }),
};
