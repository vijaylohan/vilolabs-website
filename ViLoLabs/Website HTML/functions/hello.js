// Absolute-baseline test: does Cloudflare Pages Functions work at all on
// this project? Hit https://vilolabs.in/hello after deploy. If this returns
// 404 too, Functions are disabled/broken at the project level (not a code
// or routing bug — a Pages config issue). Delete this file after diagnosis.
export function onRequest() {
  return new Response('hello from Cloudflare Pages Function', {
    status: 200,
    headers: { 'content-type': 'text/plain', 'x-debug': 'root-function-ok' },
  });
}
