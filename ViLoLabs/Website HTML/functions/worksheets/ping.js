// Isolation test — if /worksheets/ping returns "pong" after deploy but
// /worksheets/<any-slug> still returns the 404 page, we know the [slug]
// bracket-routing itself is broken. If BOTH return 404, no Function is
// running at all. Delete this file after diagnosis.
export function onRequest() {
  return new Response('pong', {
    status: 200,
    headers: { 'content-type': 'text/plain', 'x-debug': 'ping-function-invoked' },
  });
}
