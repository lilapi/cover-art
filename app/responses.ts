export function resPNGImage(
  bytes: Uint8Array,
  status = 200,
  headers = new Headers()
) {
  headers.set("Content-Type", "image/png");
  headers.set("Cache-Control", "maxage=10800");
  return new Response(bytes, { status, headers });
}

export function resJPEGImage(
  bytes: Uint8Array,
  status = 200,
  headers = new Headers()
) {
  headers.set("Content-Type", "image/jpeg");
  headers.set("Cache-Control", "maxage=10800");
  return new Response(bytes, { status, headers });
}
