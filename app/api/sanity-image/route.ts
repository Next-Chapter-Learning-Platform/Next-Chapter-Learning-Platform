import { dataset, projectId, readToken } from "@/sanity/lib/env";

// The dataset is private, so cdn.sanity.io refuses anonymous asset requests.
// This route fetches the asset with the server-only read token and streams the
// bytes back, so next/image can load covers without the token reaching the browser.

const ALLOWED_HOST = "cdn.sanity.io";
const ALLOWED_PREFIX = `/images/${projectId}/${dataset}/`;

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url");
  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  let asset: URL;
  try {
    asset = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (asset.hostname !== ALLOWED_HOST || !asset.pathname.startsWith(ALLOWED_PREFIX)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Asset URLs are immutable (the transform is baked into the query string), so
  // let Next's Data Cache absorb repeat requests instead of re-hitting Sanity.
  const upstream = await fetch(asset, {
    headers: { Authorization: `Bearer ${readToken}` },
    next: { revalidate: 31536000 },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(upstream.body, { status: 200, headers });
}
