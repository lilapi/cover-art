import type { RenderContentOptions } from "~/graphics/render";
import {
  HStack,
  interFontOfSize,
  LinearGradient,
  RemoteImage,
  Spacer,
  Text,
  VStack,
  ZStack,
} from "~/graphics/builders";
import { ParamsReader } from "~/primitives/params";
import { readBackground, readLogo, readSize, readText, renderWatermark } from "./shared";
import { toArray } from "~/primitives/iterables";

export async function messageTemplate(
  query: ParamsReader,
): Promise<RenderContentOptions> {
  const inset = 50;
  const gap = query.int("gap", 0); // TODO: docs
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
  const { logoImageURL, logoImagePosition } = readLogo(query);
  const sizeScaleFactor = Math.sqrt((width * height) / (400 * 400));

  const logoImageContent = logoImageURL != null
    ? await RemoteImage({
      url: logoImageURL,
      maxWidth: width * 0.12,
    })
    : null;

  return {
    debug: query.boolean("debug"),
    method: query.string("_method"),
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
          Text(
            line1,
            interFontOfSize(sizeScaleFactor * line1Size, line1Weight),
            line1Color,
            "center",
          ),
          ...(line2 !== ""
            ? [
              Spacer(gap),
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
      ...renderWatermark(logoImageContent, logoImagePosition),
    ], "center"),
  };
}
