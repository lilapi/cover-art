import { renderContent, RenderContentOptions } from "./graphics/render";
import { ParamsReader, readParams } from "./primitives/params";
import { resJPEGImage, resPNGImage } from "./responses";

export async function renderUsingTemplate(searchParams: URLSearchParams, template: (query: ParamsReader) => Promise<RenderContentOptions>
) {
  const params = readParams(searchParams)

  const options = await template(params);

  const format = params.string("format", "png");
  if (format === "jpeg") {
    const jpegData = await renderContent(options, { type: "jpeg", quality: 0.8 });
    return resJPEGImage(jpegData);
  } else {
    const pngData = await renderContent(options, { type: "png" });
    return resPNGImage(pngData);
  }
};
