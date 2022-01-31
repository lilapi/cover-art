import type { LoaderFunction } from "remix";
import { renderContent } from "~/graphics/render";
import { readParams } from "~/primitives/params";
import { resJPEGImage, resPNGImage } from "~/responses";
import { githubTemplate } from "~/templates/github";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url, "https://example.org");
  const params = readParams(url.searchParams)
  const options = await githubTemplate(params);
  const format = params.string("format", "png");
  if (format === "jpeg") {
    const pngData = await renderContent(options);
    return resJPEGImage(jpegData);
  } else {
    const pngData = await renderContent(options);
    return resPNGImage(pngData);
  }
};
