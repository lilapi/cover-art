import type { LoaderFunction } from "remix";
import { renderContent } from "~/graphics/render";
import { readParams } from "~/primitives/params";
import { githubTemplate } from "~/templates/github";

function resPNGImage(
  bytes: Uint8Array,
  status = 200,
  headers = new Headers()
) {
  headers.set("content-type", "image/png");
  return new Response(bytes, { status, headers });
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url, "https://example.org");
  const params = readParams(url.searchParams)
  const options = await githubTemplate(params);
  const pngData = await renderContent(options);
  return resPNGImage(pngData);
};
