/**
 * Executive Writing Assistant — private Claude server (Cloudflare Worker)
 *
 * Holds your Anthropic API key as a secret so the public web app never sees it.
 * The app calls POST /v1/messages with an "x-app-passcode" header; the worker
 * checks the passcode and the site it's called from, applies limits, and
 * forwards the request to Anthropic with your key, streaming the reply back.
 *
 * Secrets (never put these in code or the repository):
 *   ANTHROPIC_API_KEY  – your key from console.anthropic.com
 *   APP_PASSCODE       – a passcode you choose; type it into the app once per device
 * Variable (wrangler.toml [vars], not secret):
 *   ALLOWED_ORIGINS    – comma-separated sites allowed to call this server,
 *                        e.g. "https://yourname.github.io". Empty = any site (passcode still required).
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODELS = ["claude-sonnet-5", "claude-opus-5-5", "claude-haiku-4-5-20251001"];
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 8000;
const MAX_BODY_BYTES = 15 * 1024 * 1024; // room for a few photos
const MAX_MESSAGES = 64;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = originAllowed(origin, env.ALLOWED_ORIGINS);
    const cors = {
      // Echo the caller's origin so the app can read error messages; access is enforced below.
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, x-app-passcode",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!allowed) return fail(403, "forbidden_origin", "This website isn’t allowed to use this server. Add it to ALLOWED_ORIGINS.", cors);
    if (!env.ANTHROPIC_API_KEY || !env.APP_PASSCODE) return fail(500, "not_configured", "The server is missing its ANTHROPIC_API_KEY or APP_PASSCODE secret.", cors);

    const passcode = request.headers.get("x-app-passcode") || "";
    if (!(await sameSecret(passcode, env.APP_PASSCODE))) {
      await new Promise(r => setTimeout(r, 500)); // slow down guessing
      return fail(401, "bad_passcode", "Wrong passcode.", cors);
    }

    if (env.LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return fail(429, "rate_limited", "Too many requests — try again in a minute.", cors);
    }

    const url = new URL(request.url);
    if (url.pathname === "/check" && request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, models: MODELS }), { status: 200, headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" } });
    }
    if (url.pathname !== "/v1/messages" || request.method !== "POST") return fail(404, "not_found", "Not found.", cors);

    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) return fail(413, "too_large", "Request too large — try fewer or smaller photos.", cors);

    let body;
    try { body = await request.json(); } catch { return fail(400, "bad_request", "Request body must be JSON.", cors); }
    if (!body || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > MAX_MESSAGES) {
      return fail(400, "bad_request", "Request must include 1–64 messages.", cors);
    }

    // Only forward the fields the app uses, with limits applied.
    const forward = {
      model: MODELS.includes(body.model) ? body.model : DEFAULT_MODEL,
      max_tokens: Math.max(1, Math.min(Number(body.max_tokens) || 4096, MAX_TOKENS)),
      messages: body.messages,
      stream: body.stream === true
    };
    if (typeof body.system === "string") forward.system = body.system;

    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(forward)
      });
    } catch {
      return fail(502, "upstream_unreachable", "Couldn’t reach Anthropic.", cors);
    }

    const headers = new Headers(cors);
    headers.set("content-type", upstream.headers.get("content-type") || "application/json");
    headers.set("cache-control", "no-store");
    // Anthropic's own 401 means the server's key is wrong — report it distinctly from a bad passcode.
    if (upstream.status === 401) return fail(502, "server_key_invalid", "The server’s Anthropic key was rejected — update the ANTHROPIC_API_KEY secret.", cors);
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};

function originAllowed(origin, list) {
  const allowed = String(list || "").split(",").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean);
  if (!allowed.length) return true;
  return allowed.includes(origin);
}

async function sameSecret(a, b) {
  // Compare SHA-256 digests in constant time so the passcode can't be guessed by timing.
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0 && a.length > 0;
}

function fail(status, type, message, cors) {
  return new Response(JSON.stringify({ error: { type, message } }), { status, headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" } });
}
