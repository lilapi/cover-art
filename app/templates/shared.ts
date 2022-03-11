import type { ContentImageItem, ContentItem } from "~/graphics/base";
import { HStack, Spacer, VStack } from "~/graphics/builders";
import { ParamsReader } from "../primitives/params";

export function readSize(query: ParamsReader) {
  const width = query.int("w", 1200);
  const height = query.int("h", 630);

  return Object.freeze({ width, height });
}

export function readBackground(query: ParamsReader, fallback = "black") {
  const backgroundColor = query.string("bg-color", fallback);

  return Object.freeze({ backgroundColor });
}

export function readText(query: ParamsReader) {
  const line1 = query.string("t1", "");
  const line1Size = query.int("t1-size", 36);
  const line1Weight = query.int("t1-weight", 700);
  const line1Color = query.string("t1-color", "white");

  const line2 = query.string("t2", "");
  const line2Size = query.int("t2-size", 24);
  const line2Weight = query.int("t2-weight", 700);
  const line2Color = query.string("t2-color", "white");

  const line3 = query.string("t3", "");
  const line3Size = query.int("t3-size", 24);
  const line3Weight = query.int("t3-weight", 700);
  const line3Color = query.string("t3-color", "white");

  return Object.freeze({
    line1,
    line1Size,
    line1Weight,
    line1Color,
    line2,
    line2Size,
    line2Weight,
    line2Color,
    line3,
    line3Size,
    line3Weight,
    line3Color,
  });
}

export function readLogo(query: ParamsReader, fallback = "topLeft") {
  let logoImageURL = query.string("logo");
  const logoImagePosition = query.string("logo-pos", fallback);
  if (logoImageURL === "test1") {
    logoImageURL = "https://github.com/littleeagleio.png";
  } else if (logoImageURL === "test2") {
    logoImageURL =
      "https://raw.githubusercontent.com/google/material-design-icons/master/png/maps/pedal_bike/materialiconstwotone/48dp/2x/twotone_pedal_bike_black_48dp.png";
  } else if (logoImageURL === "test3") {
    // logoImageURL = "https://cdn.littleeagle.io/1/asset/0615d576e8e6c5c7bd6c3da2f284e220";
    logoImageURL = "https://landen.imgix.net/bj8ou9gm4tyq/assets/eq72fq7h.png?w=1000";
  }

  return Object.freeze({ logoImageURL, logoImagePosition });
}

export function readLogoN(query: ParamsReader, suffix: '' | '2'): string | null {
  let logoImageURL = query.string(`logo${suffix}`);
  if (logoImageURL === "test1") {
    logoImageURL = "https://github.com/littleeagleio.png";
  } else if (logoImageURL === "test2") {
    logoImageURL =
      "https://raw.githubusercontent.com/google/material-design-icons/master/png/maps/pedal_bike/materialiconstwotone/48dp/2x/twotone_pedal_bike_black_48dp.png";
  } else if (logoImageURL === "test3") {
    logoImageURL = "https://landen.imgix.net/bj8ou9gm4tyq/assets/eq72fq7h.png?w=1000";
  }

  return logoImageURL ?? null;
}

export function renderWatermark(
  imageContent: ContentImageItem | null,
  position: string,
  margin = 20,
): Array<ContentItem> {
  if (imageContent === null) return [];
  if (position === "aboveText") return [];

  return [VStack(undefined, [
    Spacer(margin),
    Spacer(
      position === "bottomLeft" ||
        position === "bottomRight"
        ? undefined
        : 0,
    ),
    HStack({ alignment: "topLeading" }, [
      Spacer(margin),
      Spacer(
        position === "topRight" ||
          position === "bottomRight"
          ? undefined
          : 0,
      ),
      imageContent,
      Spacer(margin),
    ]),
    Spacer(margin),
  ])];
}
