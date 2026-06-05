/*  ViLoLabs — Universal Supabase client
 *  ─────────────────────────────────────────────────────────────────
 *  Single file wired into any page that needs DB access.
 *  All calls are fire-and-forget (never block UI on DB errors).
 *
 *  Exposes window.ViloDB with:
 *    saveWorksheet(slug, activity, grade, category, seed)  → pSEO index
 *    saveToolShare(tool, config)  → returns { slug, url } for shareable link
 *    getToolShare(slug)           → returns config object or null
 *    trackUsage(tool, action)     → lightweight analytics (no PII)
 *    saveBlogPost(slug, title, description, category)  → pSEO blog index
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://nosskzzzkpadxakjbzdt.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc3Nrenp6a3BhZHhha2piemR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NzY3NTIsImV4cCI6MjA5NTE1Mjc1Mn0.pwBuchMlGi6KZ6vrYAfJtcQlraCdtB4DT1WKq9nnQ5I';

  /* ── Low-level fetch wrapper ── */
  function sbFetch(path, method, body) {
    return fetch(SUPABASE_URL + path, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Prefer': 'return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  function sbSelect(path) {
    return fetch(SUPABASE_URL + path, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON
      }
    });
  }

  /* ── 1. Worksheets ────────────────────────────────────────────── */
  // Called after every worksheet generation (fire-and-forget).
  // Stores slug once — duplicate slugs (same seed regenerated) are ignored
  // via ON CONFLICT DO NOTHING in the DB.
  async function saveWorksheet(slug, activity, grade, category, seed, libraryVersion) {
    try {
      const row = { slug, activity, grade, category, seed };
      if (libraryVersion != null) row.library_version = libraryVersion;
      const res = await fetch(SUPABASE_URL + '/rest/v1/worksheets?on_conflict=slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Prefer': 'return=minimal,resolution=ignore-duplicates'
        },
        body: JSON.stringify(row)
      });
      // 409 = duplicate slug (already saved) — non-fatal.
      if (!res.ok && res.status !== 409) {
        console.warn('[ViloDB] saveWorksheet HTTP ' + res.status);
      }
    } catch (e) {
      // Never surface DB errors to the user
      console.warn('[ViloDB] saveWorksheet failed (non-fatal):', e.message);
    }
  }

  /* ── 2. Tool shares ───────────────────────────────────────────── */
  // Stores a tool config and returns the pretty URL.
  //   tool   = 'resize-image' | 'qr-generator' | etc.
  //   config = plain object with settings to restore (NO file data, just params)
  //   slug   = REQUIRED. Caller decides:
  //             - canonical preset slug (e.g. "indian-passport-photo")
  //             - or unique slug w/ id   (e.g. "upi-payment-qr-9x4k2m")
  // For canonical slugs the same row may already exist — we ignore duplicates.
  async function saveToolShare(tool, config, slug) {
    if (!slug) {
      console.warn('[ViloDB] saveToolShare called without slug');
      return null;
    }
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/tool_shares?on_conflict=slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          // on_conflict=slug + resolution=ignore-duplicates → unique-slug
          // collision returns 201/200 cleanly instead of a console 409.
          'Prefer': 'return=minimal,resolution=ignore-duplicates'
        },
        body: JSON.stringify({ tool, config, slug })
      });
      if (!res.ok && res.status !== 409) throw new Error('HTTP ' + res.status);
      return { slug, url: location.origin + '/tools/' + tool + '/' + slug };
    } catch (e) {
      console.warn('[ViloDB] saveToolShare failed (non-fatal):', e.message);
      return null;
    }
  }

  // Retrieves a stored tool config by slug.
  async function getToolShare(slug) {
    try {
      const res = await sbSelect(
        '/rest/v1/tool_shares?slug=eq.' + encodeURIComponent(slug) + '&select=tool,config&limit=1'
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return rows[0] || null;
    } catch (e) {
      console.warn('[ViloDB] getToolShare failed (non-fatal):', e.message);
      return null;
    }
  }

  /* ── 3. Blog posts registry ──────────────────────────────────── */
  // Called once on blog post load (fire-and-forget).
  // Registers the post in Supabase so sitemap picks it up.
  // Duplicate slugs silently ignored (post already registered).
  async function saveBlogPost(slug, title, description, category) {
    try {
      // on_conflict=slug tells PostgREST which column the UNIQUE constraint is on,
      // so resolution=ignore-duplicates can actually silence the 409 on re-loads.
      const res = await fetch(SUPABASE_URL + '/rest/v1/blog_posts?on_conflict=slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Prefer': 'return=minimal,resolution=ignore-duplicates'
        },
        body: JSON.stringify({ slug, title, description, category })
      });
      // 409 = duplicate (already registered) — treat as success, don't log.
      if (!res.ok && res.status !== 409) {
        console.warn('[ViloDB] saveBlogPost HTTP ' + res.status);
      }
    } catch (e) {
      console.warn('[ViloDB] saveBlogPost failed (non-fatal):', e.message);
    }
  }

  /* ── 4. Usage analytics (no PII — just counts) ───────────────── */
  async function trackUsage(tool, action) {
    try {
      await sbFetch('/rest/v1/tool_usage', 'POST', { tool, action });
    } catch (e) {
      // Silently ignore
    }
  }

  /* ── 5. Page-view counter (no PII — just a count per URL path) ──
   * Calls the SECURITY-DEFINER function bump_page_view(p) which upserts
   * + increments a row in the `page_views` table. Anon can only call the
   * function and READ counts — never write the table directly.            */
  async function trackPageView(path) {
    try {
      path = path || (location.pathname || '/');
      await fetch(SUPABASE_URL + '/rest/v1/rpc/bump_page_view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON
        },
        body: JSON.stringify({ p: path })
      });
    } catch (e) { /* never surface */ }
  }

  // Read counts. No arg → TOTAL across all pages. With a path → that page only.
  async function getPageViews(path) {
    try {
      if (path) {
        const res = await sbSelect('/rest/v1/page_views?path=eq.' +
          encodeURIComponent(path) + '&select=views&limit=1');
        const rows = await res.json();
        return rows[0] ? rows[0].views : 0;
      }
      const res = await sbSelect('/rest/v1/page_views?select=views');
      const rows = await res.json();
      return rows.reduce((s, r) => s + (r.views || 0), 0);
    } catch (e) { return null; }
  }

  /* ── Expose ── */
  window.ViloDB = { saveWorksheet, saveToolShare, getToolShare, trackUsage, saveBlogPost, trackPageView, getPageViews };

  // Auto-fire a page-view beacon once per load (fire-and-forget, never blocks).
  // Skip localhost / dev so testing doesn't inflate real counts.
  try {
    if (!/^(localhost|127\.|0\.0\.0\.0|192\.168\.|\[?::1)/.test(location.hostname)) trackPageView();
  } catch (e) {}
})();
