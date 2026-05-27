# PharmaBro — Cloudflare Pages Deployment

Two pieces ship together to the same Pages project:

1. **Static SPA** — built from `src/` to `dist/`
2. **Pages Functions** — `functions/api/*.js` is auto-bundled as the serverless backend

The backend needs a **KV namespace** for auth keys, sessions, and per-user progress.

---

## One-time setup (admin)

You'll do this once. Then deploys are just `git push`.

### 1. Install Wrangler (Cloudflare CLI)

```bash
npm install -g wrangler
wrangler login    # opens your browser, sign in to Cloudflare
```

### 2. Create the KV namespace

```bash
wrangler kv namespace create PHARMABRO_KV
```

The output looks like:
```
🌀 Creating namespace with title "pharmabro-PHARMABRO_KV"
✨ Success!
Add the following to your configuration file:
{ binding = "PHARMABRO_KV", id = "abc123def456..." }
```

Copy that `id`. There are two ways to wire it:

**Option A — via dashboard (easiest, recommended)**

1. Cloudflare Dashboard → Workers & Pages → your `pharmabro` project
2. Settings → Functions → **KV namespace bindings** → Add binding
3. Variable name: `PHARMABRO_KV`
4. KV namespace: pick the one you just created
5. Save. Trigger a redeploy (or push any change).

**Option B — via wrangler.toml**

Open `app/wrangler.toml` and replace `REPLACE_WITH_KV_NAMESPACE_ID` with the
real id, then commit + push.

### 3. Upload the 500 keys

The generator already wrote `admin/keys-kv-bulk.json` (in repo root, ignored by
deploy). Upload it:

```bash
cd ../   # back to project root, where admin/ lives
wrangler kv bulk put admin/keys-kv-bulk.json --binding=PHARMABRO_KV --remote
```

You should see `Success! Uploaded 500 key-value pairs`.

> If `--binding=PHARMABRO_KV` fails to resolve, use `--namespace-id=<the id>`
> directly instead.

### 4. Set the admin token (optional)

Lets you call `/api/admin/stats` to see how many keys/sessions are active.

```bash
wrangler pages secret put ADMIN_TOKEN --project-name=pharmabro
# paste a long random string when prompted
```

Now `curl -H "Authorization: Bearer <ADMIN_TOKEN>" https://<your-pages>.pages.dev/api/admin/stats`
returns counts.

### 5. Distribute keys

`admin/keys.csv` and `admin/keys.txt` have the plaintext keys, one per line.
Send them to users via whatever channel you prefer.

---

## Day-to-day deploy

Cloudflare Pages auto-deploys on every push to `main`:

```bash
git push origin main
```

Pages picks up:
- `index.html`, `src/`, `public/` → builds with `npm run build` → `dist/`
- `functions/` → auto-deployed as `/api/*` endpoints

Build settings (already configured in the Pages project):
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `app`

---

## How auth + sync works

```
User pastes key → POST /api/auth/login
  ↓
KV check: key:{KEY} must exist
  ↓
KV check: session:{KEY} must not be held by another device
  ↓
Issue token, save session:{KEY} = {token, deviceId, lastSeen}
  ↓
Client polls /api/auth/heartbeat every 30s (refreshes lastSeen)
  ↓
On every quiz action: debounced POST /api/progress (saves progress:{KEY})
  ↓
On other device login: looks up session:{KEY}, sees lastSeen<60s ago → 409
On other device login (after 60s of no heartbeat): treats stale, takes over
```

Heartbeat interval: 30s. Stale threshold: 60s. Both in `functions/_utils.js`
and `App.jsx`.

---

## Generating more keys later

```bash
python generate_keys.py -n 100         # generates 100 more
wrangler kv bulk put admin/keys-kv-bulk.json --binding=PHARMABRO_KV --remote
```

The script overwrites `admin/keys.csv` each run, so save the old file first if
you don't want to lose the prior batch.

## Revoking a key

```bash
wrangler kv key delete "key:ABCD-EFGH-JKLM-NPQR" --binding=PHARMABRO_KV --remote
# Optional: also blow away their session and progress
wrangler kv key delete "session:ABCD-EFGH-JKLM-NPQR" --binding=PHARMABRO_KV --remote
wrangler kv key delete "progress:ABCD-EFGH-JKLM-NPQR" --binding=PHARMABRO_KV --remote
```

---

## Local dev

```bash
npm install
npm run dev          # localhost:5173 — API calls 404 (no Functions runtime)
# OR with functions:
npx wrangler pages dev dist --kv PHARMABRO_KV
```

For local-dev of Functions you need wrangler to spin up an emulated KV. The
quickest path: just push to a `dev` branch and let Cloudflare Pages give you a
preview URL with all the real bindings.
