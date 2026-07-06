// Server-side only — shared by API routes that need IP-based rate limiting.

export function getClientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Fails open on error: the per-user limit each caller already enforces fails closed on its own
// DB error, so this stays defense-in-depth rather than a second point of total failure.
export async function checkIpLimit(client, ip, route, limit) {
  const { data: allowed, error } = await client.rpc("increment_ip_rate_limit", { p_ip: ip, p_route: route, p_limit: limit });
  if (error) {
    console.error(`IP rate limit check failed for ${route}:`, error);
    return true;
  }
  return allowed;
}
