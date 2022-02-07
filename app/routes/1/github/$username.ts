import type { LoaderFunction } from "remix";
import { renderUsingTemplate } from "~/handlers";
import { githubTemplate } from "~/templates/github";

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url, "https://example.org");
  if (typeof params['username'] === 'string') {
    url.searchParams.set('username', params['username']);
  }
  return renderUsingTemplate(url.searchParams, githubTemplate);
};
