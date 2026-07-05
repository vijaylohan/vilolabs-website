/*  ViLoLabs — Cloudflare Pages Function · /captures/<date>/<slug>.webp
 *  ─────────────────────────────────────────────────────────────────
 *  Same-domain image proxy for auto-captured worksheet snapshots. Fetches the
 *  WebP from the PUBLIC Supabase Storage bucket and re-serves it from
 *  vilolabs.in with a 1-year immutable cache. Two reasons this exists
 *  (see HANDOFF-auto-capture.md Amendment 2):
 *    1. Google Images trusts same-domain image URLs; supabase.co can't be
 *       verified in Search Console.
 *    2. Cloudflare's edge caches the response, so Supabase egress stays near
 *       zero even under Googlebot / Pinterest recrawls of hundreds of images.
 *
 *  storage_path (in the DB) maps 1:1 to the path here: the row stores
 *  public_url = https://vilolabs.in/captures/<storage_path>, and <storage_path>
 *  is <utc-date>/<slug>.webp inside the bucket.
 *
 *  Immutable is safe because a given path's bytes never change (slug+date is
 *  unique per capture). Retired images stop being referenced by the gallery +
 *  sitemap, so nobody requests them and edge entries evict naturally.
 *
 *  Local test:
 *    curl -sI https://vilolabs.in/captures/2026-07-05/<slug>.webp
 */

const BUCKET = 'worksheet-captures';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // [[path]] gives an array of decoded segments (or a string). Rebuild the
  // relative object path and hard-validate it — only safe .webp paths allowed.
  const rel = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (rel.includes('..') || !/^[A-Za-z0-9][A-Za-z0-9/_-]*\.webp$/.test(rel)) {
    return new Response('Not found', { status: 404 });
  }

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const SUPA = env.SUPABASE_URL;
  if (!SUPA) return new Response('Not configured', { status: 500 });

  let upstream;
  try {
    upstream = await fetch(`${SUPA}/storage/v1/object/public/${BUCKET}/${rel}`);
  } catch {
    return new Response('Upstream error', { status: 502 });
  }
  if (!upstream.ok) return new Response('Not found', { status: 404 });

  const resp = new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  // Populate the edge cache without blocking the response.
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
