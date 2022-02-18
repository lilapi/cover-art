import type { RenderContentOptions } from "~/graphics/render";
import {
  HStack,
  interFontOfSize,
  LinearGradient,
  RemoteImage,
  Spacer,
  Text,
  TextShadow,
  VStack,
  ZStack,
} from "~/graphics/builders";
import { ParamsReader } from "~/primitives/params";
import { readBackground, readLogo, readLogoN, readSize, readText, renderWatermark } from "./shared";
import { toArray } from "~/primitives/iterables";

export async function overlayLeftTemplate(
  query: ParamsReader,
): Promise<RenderContentOptions> {
  const inset = 50;
  const gap = query.int("gap", 0); // TODO: docs
  const { width, height } = readSize(query);
  const sizeScaleFactor = Math.sqrt((width * height) / (400 * 400));
  const { backgroundColor } = readBackground(query, "none");
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
  const topLeftLogoImageURL = readLogoN(query, '');
  const topRightLogoImageURL = readLogoN(query, '2');

  let heroImageURL = query.string("img");
  if (heroImageURL === "test1") {
    heroImageURL =
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80";
  } else if (heroImageURL === "test2") {
    heroImageURL =
      "https://images.unsplash.com/photo-1557401622-cfc0aa5d146c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1240&q=80";
  } else if (heroImageURL === "test3") {
    heroImageURL =
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80";
  } else if (heroImageURL === "test4") {
    heroImageURL =
      "https://images.unsplash.com/photo-1522248105696-9625ba87de6e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80";
  }

  console.log("hero image", heroImageURL);

  const heroImageContent = heroImageURL != null
    ? await RemoteImage({
      url: heroImageURL,
      grow: true,
      maxWidth: Infinity,
    })
    : null;

  const topLeftLogoImageContent = topLeftLogoImageURL != null
    ? await RemoteImage({
      url: topLeftLogoImageURL,
      maxWidth: width * 0.24,
      maxHeight: height * 0.24,
    })
    : null;
  const topRightLogoImageContent = topRightLogoImageURL != null
    ? await RemoteImage({
      url: topRightLogoImageURL,
      maxWidth: width * 0.24,
      maxHeight: height * 0.24,
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
    backgroundColor: backgroundColor === 'none' ? '#000' : backgroundColor,
    content: ZStack([
      ...(heroImageContent != null ? [heroImageContent] : []),
      ...(backgroundColor === 'none' ? [] : [LinearGradient(
        toArray(function* () {
          const quality = 15;
          for (let i = 0; i <= quality; i++) {
            let t = i / quality;
            t = Math.sin(t * Math.PI / 2);
            const hex = Math.round(t * 255).toString(16).padStart(2, "0");
            yield `${backgroundColor}${hex}`;
          }
        }),
        { x: 0.6, y: 0 },
        { x: 0.4, y: 0 },
      )]),
      HStack({ maxWidth: width * .75, alignment: 'leading' }, [
        Spacer(line1Size * sizeScaleFactor * .5),
        VStack({ alignment: 'leading' }, [
          Spacer(),
          ...(topLeftLogoImageContent == null ? [] : [Spacer(line1Size * sizeScaleFactor * .5)]),
          Text(
            line1,
            interFontOfSize(sizeScaleFactor * line1Size, line1Weight),
            line1Color,
            'leading',
            TextShadow(16, '#00000066', 8, 8),
          ),
          ...(line2 !== ""
            ? [
              Spacer(gap),
              Text(
                line2,
                interFontOfSize(sizeScaleFactor * line2Size, line2Weight),
                line2Color,
                'leading',
              ),
            ]
            : []),
          Spacer(),
        ]),
        Spacer(),
      ]),
      ...renderWatermark(topLeftLogoImageContent, 'topLeft', line1Size * sizeScaleFactor * .5),
      ...renderWatermark(topRightLogoImageContent, 'topRight', line1Size * sizeScaleFactor * .5),
    ], 'center'),
  };
}
