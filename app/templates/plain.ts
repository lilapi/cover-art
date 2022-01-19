import type { RenderContentOptions } from "../graphics/render";
import {
  HStack,
  interFontOfSize,
  RemoteImage,
  Spacer,
  Text,
  VStack,
  ZStack,
} from "../graphics/builders";
import { ParamsReader } from "../primitives/params";
import { readBackground, readSize, readText } from "./shared";

export async function plainTemplate(
  query: ParamsReader,
): Promise<RenderContentOptions> {
  const inset = 50;
  const { width, height } = readSize(query);
  const { backgroundColor } = readBackground(query);
  const {
    line1,
    line1Size,
    line1Color,
    line2,
    line2Size,
    line2Color,
  } = readText(query);

  let heroImageURL = query.string("img");
  const heroImageSide = query.string("img-pos", "right");
  const sizeScaleFactor = Math.sqrt((width * height) / (400 * 400));
  if (heroImageURL === "test1") {
    heroImageURL =
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80";
  } else if (heroImageURL === "test2") {
    heroImageURL =
      "https://images.unsplash.com/photo-1557401622-cfc0aa5d146c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1240&q=80";
  }

  let logoImageURL = query.string("logo");
  const logoImagePosition = query.string("logo-pos", "topLeft");
  if (logoImageURL === "test1") {
    logoImageURL = "https://github.com/littleeagleio.png";
  } else if (logoImageURL === "test2") {
    logoImageURL = "https://raw.githubusercontent.com/google/material-design-icons/master/png/maps/pedal_bike/materialiconstwotone/48dp/2x/twotone_pedal_bike_black_48dp.png";
  }

  const heroImageContent = heroImageURL != null
    ? await RemoteImage({
      url: heroImageURL,
      grow: true,
      maxWidth: width * 0.6,
    })
    : null;

  const logoImageContent = logoImageURL != null
    ? await RemoteImage({
      url: logoImageURL,
      maxWidth: width * 0.1,
    })
    : null;

  const leftImageContent = heroImageSide === "left" ? heroImageContent : null;
  const rightImageContent = heroImageSide === "right" ? heroImageContent : null;

  return {
    width,
    height,
    centerY: false,
    centerX: false,
    insetX: 0,
    insetY: 0,
    backgroundColor,
    content: ZStack(undefined, [
      HStack({ inset: { l: 0, r: 0, t: 0, b: 0 } }, [
        ...(leftImageContent != null
          ? [leftImageContent, Spacer(30)]
          : [Spacer(inset)]),
        VStack(undefined, [
          Text(
            line1,
            interFontOfSize(sizeScaleFactor * line1Size, 700),
            line1Color,
          ),
          Text(
            line2,
            interFontOfSize(sizeScaleFactor * line2Size, 700),
            line2Color,
          ),
        ]),
        ...(rightImageContent != null
          ? [Spacer(), Spacer(10), rightImageContent]
          : [Spacer()]),
      ]),
      ...(logoImageContent != null
        ? [VStack(undefined, [
          Spacer(10),
          Spacer(
            logoImagePosition === "bottomLeft" ||
              logoImagePosition === "bottomRight"
              ? undefined
              : 0,
          ),
          HStack({}, [
            Spacer(10),
            Spacer(
              logoImagePosition === "topRight" ||
                logoImagePosition === "bottomRight"
                ? undefined
                : 0,
            ),
            logoImageContent,
            Spacer(10),
          ]),
          Spacer(10),
        ])]
        : []),
    ]),
  };
}
