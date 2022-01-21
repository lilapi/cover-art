import type { LoaderFunction } from "remix";
import { renderContent } from "~/graphics/render";
import { readParams } from "~/primitives/params";
import { messageTemplate } from "~/templates/message";

function resPNGImage(
  bytes: Uint8Array,
  status = 200,
  headers = new Headers()
) {
  headers.set("Content-Type", "image/png");
  headers.set("Cache-Control", "maxage=10800");
  return new Response(bytes, { status, headers });
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url, "https://example.org");
  const params = readParams(url.searchParams)
  const options = await messageTemplate(params);
  const pngData = await renderContent(options);
  return resPNGImage(pngData);
};
