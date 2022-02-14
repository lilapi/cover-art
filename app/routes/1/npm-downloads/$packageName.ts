import type { LoaderFunction } from "remix";
import { renderUsingTemplate } from "~/handlers";
import { npmDownloadsTemplate } from "~/templates/npm-downloads";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url, "https://example.org");
  const packageName = params['packageName'];
  if (typeof packageName !== 'string') {
    throw new Response(null, { status: 404 });
  }
  return renderUsingTemplate(url.searchParams, npmDownloadsTemplate.bind(null, packageName));
};
