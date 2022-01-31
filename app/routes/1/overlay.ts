import type { LoaderFunction } from "remix";
import { renderUsingTemplate } from "~/handlers";
import { overlayTemplate } from "~/templates/overlay";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url, "https://example.org");
  return renderUsingTemplate(url.searchParams, overlayTemplate);
};
