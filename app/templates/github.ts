import type { RenderContentOptions } from "~/graphics/render";
import {
  HStack,
  interFontOfSize,
  RemoteImage,
  Spacer,
  Text,
  VStack,
} from "~/graphics/builders";
import { ParamsReader } from "~/primitives/params";
import { readBackground, readSize, readText } from "./shared";

export async function githubTemplate(
  githubUsername: string,
  query: ParamsReader,
): Promise<RenderContentOptions> {
  const { width, height } = readSize(query);
  const inset = 50;
  const { backgroundColor } = readBackground(query, "#111");
  const {
    line1,
    line1Size,
    line1Color,
    line2,
    line2Size,
    line2Color,
    line3,
    line3Size,
    line3Weight,
    line3Color,
  } = readText(query);

  const sizeScaleFactor = Math.sqrt((width * height) / (400 * 400));
  const displayName = query.string("author-name", `@${githubUsername}`);
  const websiteText = query.string("website");
  const githubAvatarURL = `https://github.com/${githubUsername}.png`;
  const authorColor = query.string("author-color", "#fffa");

  let heroImageURL = query.string("img");
  const heroImageSide = query.string("img-pos", "right");

  if (heroImageURL === "test1") {
    heroImageURL =
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80";
  } else if (heroImageURL === "test2") {
    heroImageURL =
      "https://images.unsplash.com/photo-1557401622-cfc0aa5d146c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1240&q=80";
  }

  console.log("hero image", heroImageURL);

  console.time("LOAD REMOTE IMAGES");
  const avatarImageContent = await RemoteImage({
    url: githubAvatarURL,
    maxWidth: 200,
    rounded: true,
  });
  const heroImageContent = heroImageURL != null
    ? await RemoteImage({
      url: heroImageURL,
      grow: true,
      maxWidth: width * 0.6,
    })
    : null;
  console.timeEnd("LOAD REMOTE IMAGES");

  const leftImageContent = heroImageSide === "left" ? heroImageContent : null;
  const rightImageContent = heroImageSide === "right" ? heroImageContent : null;

  // Try to emulate: https://poster.littleeagle.workers.dev/compare?url=https%3A%2F%2Fkentcdodds.com%2F
  return Object.freeze({
    width,
    height,
    centerY: false,
    centerX: false,
    insetX: 0,
    insetY: 0,
    backgroundColor,
    debug: query.boolean("debug"),
    content: HStack({ inset: { l: 0, r: 0, t: 0, b: 0 } }, [
      // ...(leftImageContent != null
      //   ? [leftImageContent, Spacer(30)]
      //   : [Spacer(inset)]),
      Spacer(inset),
      VStack(undefined, [
        Spacer(inset),
        Text(
          line1,
          interFontOfSize(sizeScaleFactor * line1Size, 700),
          line1Color,
        ),
        Spacer(12),
        Text(
          line2,
          interFontOfSize(sizeScaleFactor * line2Size, 700),
          line2Color,
        ),
        ...(line3 !== ""
          ? [
            Spacer(12),
            Text(
              line3,
              interFontOfSize(sizeScaleFactor * line3Size, line3Weight),
              line3Color,
              'leading',
            ),
          ]
          : []),
        Spacer(),
        Spacer(height / 12),
        HStack({ alignment: "leading" }, [
          ...(avatarImageContent != null ? [avatarImageContent] : []),
          Spacer(50),
          VStack(undefined, [
            Text(
              displayName,
              interFontOfSize(sizeScaleFactor * 16, 400),
              authorColor,
            ),
            ...(websiteText != null
              ? [
                Spacer(10),
                Text(
                  websiteText,
                  interFontOfSize(sizeScaleFactor * 12, 400),
                  authorColor,
                ),
              ]
              : []),
          ]),
        ]),
        Spacer(inset),
      ]),
      ...(rightImageContent != null
        ? [Spacer(), Spacer(10), rightImageContent]
        : [Spacer()]),
    ]),
  });
}
