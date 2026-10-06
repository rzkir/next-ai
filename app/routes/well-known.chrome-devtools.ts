// Chrome DevTools probes this URL; return 404 quietly so the router
// does not log "No route matches URL".
export function loader() {
  return new Response(null, { status: 404 });
}
