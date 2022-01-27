import type { RenderContentOptions } from "~/graphics/render";
import {
  HStack,
  interFontOfSize,
  RemoteImage,
  Spacer,
  Text,
  VStack,
  ZStack,
} from "~/graphics/builders";
import { ParamsReader } from "~/primitives/params";
import { readBackground, readLogo, readSize, readText, renderWatermark } from "./shared";

export async function messageTemplate(
  query: ParamsReader,
): Promise<RenderContentOptions> {
  const { width, height } = readSize(query);
  const { backgroundColor } = readBackground(query);
  const {
    line1,
    line1Size,
    line1Weight,
    line1Color,
    line2,
    line2Size,
    line2Weight,
    line2Color,
  } = readText(query);
  const { logoImageURL } = readLogo(query, "aboveText");
  const sizeScaleFactor = Math.sqrt((width * height) / (400 * 400));

  const logoImageContent = logoImageURL != null
    ? await RemoteImage({
      url: logoImageURL,
      maxWidth: width * 0.4,
      maxHeight: height * 0.4,
    })
    : null;

  return {
    debug: query.boolean("debug"),
    width,
    height,
    centerY: false,
    centerX: false,
    insetX: 0,
    insetY: 0,
    backgroundColor,
    content: ZStack(width, [
      HStack({}, [
        Spacer(10 * sizeScaleFactor),
        Spacer(),
        VStack(undefined, [
          Spacer(),
          ...(logoImageContent != null ? [logoImageContent] : []),
          Text(
            line1,
            interFontOfSize(sizeScaleFactor * line1Size, line1Weight),
            line1Color,
            "center",
          ),
          ...(line2 !== ""
            ? [
              Spacer(sizeScaleFactor * (line1Size + line2Size) * 0.05),
              Text(
                line2,
                interFontOfSize(sizeScaleFactor * line2Size, line2Weight),
                line2Color,
                "center",
              ),
            ]
            : []),
          Spacer(),
        ]),
        Spacer(),
        Spacer(10 * sizeScaleFactor),
      ]),
    ], "center"),
  };
}
