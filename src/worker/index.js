/* Direct Action · the Worker. Cloudflare serves any file in dist/ before this runs; everything else arrives here.
   /api/ is the app's own server: today only its health, next the print queue and shared records (docs/roadmap.md). */
const TEXT = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/health') return new Response('ok', { headers: TEXT });
    if (pathname.startsWith('/api/')) return new Response('not found', { status: 404, headers: TEXT });
    return env.ASSETS.fetch(request);
  },
};
