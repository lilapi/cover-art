import type { LoaderFunction } from "remix";
import { renderUsingTemplate } from "~/handlers";
import { githubTemplate } from "~/templates/github";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url, "https://example.org");
  const username = params['username'];
  if (typeof username !== 'string') {
    throw new Response(null, { status: 404 });
  }
  return renderUsingTemplate(url.searchParams, githubTemplate.bind(null, username));
};
