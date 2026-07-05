// ============================================================================
// POST /api/capture  — auto-capture pipeline receiver
// ----------------------------------------------------------------------------
// Receives a worksheet snapshot from worksheet.html (fire-and-forget), validates
// EVERYTHING server-side (never trusts the client), stores the WebP in Supabase
// Storage, and inserts a row into captured_worksheets. See HANDOFF-auto-capture.md.
//
// Design notes (amendments in the handoff):
//  - Origin-gated (drive-by abuse block); same-origin only, so NO CORS headers.
//  - Activity is honesty-gated to colouring/maze/sudoku (Math Master deferred).
//  - Daily cap + total cap counted server-side in UTC.
//  - Duplicate active slug rejected (also enforced by a unique partial index).
//  - Retirement past 500 is SOFT (sets retired_at); storage bytes are swept
//    later by the nightly job (>48h), so sitemap-listed images never 404.
//  - storage_path = "<utc-date>/<slug>.webp"; public_url points at our own
//    /captures/<path> proxy (built next session) — same-domain for Google trust
//    and Cloudflare-edge-cached to keep Supabase egress near zero.
//
// The service_role key lives ONLY here, as a Cloudflare Pages env var. It never
// touches git or the client. The anon key can only READ active rows (RLS).
// ============================================================================

// colouring/maze/sudoku = single-focus; worksheet = a class-wise mix sheet
// (Pre-KG–Class 5); math = Math Master. The client normalizes curLvl to one of
// these before sending. Must stay in sync with the DB CHECK constraint.
const ALLOWED   = new Set(['colouring', 'maze', 'sudoku', 'worksheet', 'math']);
const DAILY_CAP = 5;
const TOTAL_CAP = 500;
const MAX_BYTES = 500 * 1024;
const MIN_BYTES = 200;
const SITE      = 'https://vilolabs.in';
const BUCKET    = 'worksheet-captures';

export async function onRequestPost(context) {
  try {
    return await handle(context);
  } catch (err) {
    // Never leak a stack; client fails silently anyway. Log for CF dashboard.
    console.error('[capture] uncaught', err && err.message);
    return json(500, { error: 'internal' });
  }
}

async function handle({ request, env }) {
  // 1. Origin gate (Amendment 8) — trivially spoofable by curl, but stops
  //    drive-by browser abuse for free. The real ceiling is the daily cap.
  const origin = request.headers.get('Origin');
  if (origin && origin !== SITE) return json(403, { error: 'bad origin' });

  // 2. Content-Type must be multipart
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('multipart/form-data')) return json(400, { error: 'expected multipart/form-data' });

  // 3. Server must be configured
  const SUPA = env.SUPABASE_URL;
  const KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPA || !KEY) return json(500, { error: 'server not configured' });

  // 4. Parse the form
  let form;
  try { form = await request.formData(); } catch { return json(400, { error: 'bad form' }); }
  const slug     = String(form.get('slug') || '').trim();
  const activity = String(form.get('activity') || '').trim();
  const subject  = String(form.get('subject') || '').trim();
  const image    = form.get('image');

  // 5. Activity honesty gate
  if (!ALLOWED.has(activity)) return json(400, { error: 'ineligible activity' });

  // 6. Slug shape (kebab-case, bounded). Full WSeo parse is overkill server-side;
  //    the shape check + the DB check constraint on activity cover us.
  if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/.test(slug)) return json(400, { error: 'bad slug' });

  // 7. Image presence + size + magic bytes (never trust Content-Type)
  if (!image || typeof image === 'string') return json(400, { error: 'no image' });
  const buf = new Uint8Array(await image.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return json(400, { error: 'too large' });
  if (buf.byteLength < MIN_BYTES) return json(400, { error: 'too small' });
  // WebP = "RIFF" (0..3) .... "WEBP" (8..11)
  const isWebp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
                 buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  if (!isWebp) return json(400, { error: 'not webp' });

  // Supabase REST/Storage helper (service_role → bypasses RLS)
  const sb = (path, init = {}) => fetch(SUPA + path, {
    ...init,
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, ...(init.headers || {}) },
  });

  // 8. Daily cap — count today's active captures (UTC, Amendment 6)
  const dayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00Z';
  const dayRes = await sb(
    `/rest/v1/captured_worksheets?select=id&retired_at=is.null&captured_at=gte.${dayStart}`,
    { headers: { Prefer: 'count=exact', Range: '0-0' } }
  );
  if (countFrom(dayRes) >= DAILY_CAP) return json(429, { error: 'daily cap reached' });

  // 9. Duplicate active slug (defense-in-depth; unique partial index is authoritative)
  const dupRes = await sb(
    `/rest/v1/captured_worksheets?select=id&retired_at=is.null&slug=eq.${encodeURIComponent(slug)}`,
    { headers: { Prefer: 'count=exact', Range: '0-0' } }
  );
  if (countFrom(dupRes) > 0) return json(409, { error: 'duplicate slug' });

  // 10. Upload to Storage. storage_path maps 1:1 to the /captures/<path> proxy URL.
  const today       = new Date().toISOString().slice(0, 10);
  const storagePath = `${today}/${slug}.webp`;
  const up = await sb(`/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp', 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) return json(500, { error: 'storage upload failed' });

  const publicUrl = `${SITE}/captures/${storagePath}`;
  const altText   = buildAlt(slug, activity, subject);

  // 11. Insert DB row. If it fails, compensate by deleting the just-uploaded blob.
  const ins = await sb('/rest/v1/captured_worksheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      slug, activity, storage_path: storagePath, public_url: publicUrl, alt_text: altText,
    }),
  });
  if (!ins.ok) {
    // 409 = the unique index caught a race the count check missed → clean up, report dup.
    const status = ins.status === 409 ? 409 : 500;
    await sb(`/storage/v1/object/${BUCKET}/${storagePath}`, { method: 'DELETE' });
    return json(status, { error: status === 409 ? 'duplicate slug' : 'db insert failed' });
  }
  const row = (await ins.json())[0];

  // 12. Retire oldest if over the 500 ceiling — SOFT only (Amendment 5).
  //     Storage bytes are swept by the nightly job (>48h), never here.
  const totRes = await sb(
    '/rest/v1/captured_worksheets?select=id&retired_at=is.null',
    { headers: { Prefer: 'count=exact', Range: '0-0' } }
  );
  const total = countFrom(totRes);
  if (total > TOTAL_CAP) {
    const over = total - TOTAL_CAP;
    const oldRes = await sb(
      `/rest/v1/captured_worksheets?select=id&retired_at=is.null&order=captured_at.asc&limit=${over}`
    );
    const ids = (await oldRes.json()).map(r => r.id);
    if (ids.length) {
      await sb(`/rest/v1/captured_worksheets?id=in.(${ids.join(',')})`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retired_at: new Date().toISOString() }),
      });
    }
  }

  return json(200, { publicUrl, id: row.id });
}

// PostgREST returns the exact count in the Content-Range header ("0-0/123").
function countFrom(res) {
  const m = (res.headers.get('content-range') || '').match(/\/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

// Alt text. Prefer the actual page SUBJECT sent by the client (e.g. "Dog" from a
// "Colour Dog" page) → matches what's IN the image + unique per capture. Falls
// back to a slug-derived description for pages with no clear subject (maze/sudoku).
function buildAlt(slug, activity, subject) {
  // '' → the word "worksheet" alone (grade mixes aren't a single activity).
  const label = { colouring: 'colouring ', maze: 'maze ', sudoku: 'sudoku ', worksheet: '', math: 'math ' }[activity];
  const lbl = label != null ? label : (activity + ' ');
  const clean = sanitizeSubject(subject);
  if (clean) {
    return `${clean} — a free printable ${lbl}worksheet (sample page) from ViLo Worksheets`;
  }
  const words = slug.replace(/-[a-z0-9]{5,}$/i, '').replace(/-/g, ' ').trim();
  const human = words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Printable';
  return `${human} — a free printable ${lbl}worksheet sample page from ViLo Worksheets`;
}

// Never trust client text in an alt attribute: strip anything HTML-ish/control,
// collapse whitespace, cap length. HTMLRewriter escapes on inject too, but this
// keeps the stored value clean and safe.
function sanitizeSubject(s) {
  if (!s) return '';
  const cleaned = s.replace(/[<>&"'`\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  return cleaned;
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
