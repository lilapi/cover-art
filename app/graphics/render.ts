import type {
  ContentHStackItem,
  ContentVStackItem,
  ContentZStackItem,
  LayoutItem,
} from "./base";
import { importCanvas } from "./deps";
import { drawItemBounds, drawItemsIntoContext2D } from "./drawing";
import { inter400Font, inter700Font } from "./fonts";
import {
  cleanUpLayoutItem,
  layoutHStackItems,
  layoutItemsCenterX,
  layoutItemsCenterY,
  layoutVStackItems,
  layoutZStackItems,
} from "./layout";
import { makeRenderingFactory } from "./renderingFactory";

export interface RenderContentOptions {
  width: number;
  height: number;
  centerY: boolean;
  centerX: boolean;
  insetX: number;
  insetY: number;
  backgroundColor?: string;
  content: ContentVStackItem | ContentHStackItem | ContentZStackItem;
  debug?: boolean;
}
export async function renderContent(
  {
    width: w,
    height: h,
    centerY,
    centerX,
    insetX,
    insetY,
    backgroundColor = "#eee",
    content,
    debug = false,
  }: RenderContentOptions,
  format: { type: "png" } | { type: "jpeg"; quality: number },
): Promise<Uint8Array> {
  const canvasImports = await importCanvas();
  const { createCanvas, GlobalFonts } = canvasImports;

  const scale = 1;

  console.time("renderContent()");

  console.time("load fonts");
  GlobalFonts.register(Buffer.from(await inter400Font), "Inter");
  GlobalFonts.register(Buffer.from(await inter700Font), "Inter");
  console.timeEnd("load fonts");

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const factory = makeRenderingFactory(canvasImports, ctx);

  console.time("layout");

  let layoutItems: Array<LayoutItem> = [];
  if (content.type === "hstack") {
    layoutItems = Array.from(layoutHStackItems(content.items, {
      alignment: content.alignment ?? "leading",
      measure: w - (insetX * 2),
      x: insetX,
      minY: insetY,
      maxY: h - (insetY * 2),
      factory,
    }));

    // TODO: we should align based on alignment, not these flags.
    if (centerY) {
      layoutItems = Array.from(layoutItemsCenterY(h, layoutItems));
    }
    if (centerX) {
      layoutItems = Array.from(layoutItemsCenterX(w, layoutItems));
    }
  } else if (content.type === "vstack") {
    layoutItems = Array.from(layoutVStackItems(content.items, {
      alignment: content.alignment ?? "leading",
      measure: w - (insetX * 2),
      minX: insetX,
      minY: insetY,
      maxY: h - (insetY * 2),
      factory,
    }));

    // TODO: we should align based on alignment, not these flags.
    if (centerY) {
      layoutItems = Array.from(layoutItemsCenterY(h, layoutItems));
    }
    if (centerX) {
      layoutItems = Array.from(layoutItemsCenterX(w, layoutItems));
    }
  } else if (content.type === "zstack") {
    layoutItems = Array.from(
      layoutZStackItems(content.items, content.alignment, {
        measure: w - (insetX * 2),
        minX: insetX,
        minY: insetY,
        maxY: h - (insetY * 2),
        factory,
      }),
    );
  }

  console.timeEnd("layout");

  console.time("drawItems()");

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, w, h);

  drawItemsIntoContext2D(ctx, layoutItems);
  if (debug) {
    drawItemBounds(ctx, layoutItems);
  }
  console.timeEnd("drawItems()");

  layoutItems.forEach((item) => cleanUpLayoutItem(item));

  console.log("render content: drew items");

  if (format.type === "png") {
    console.time("convert to PNG");
    const pngDataBuffer = await canvas.encode("png");
    const pngData = new Uint8Array(pngDataBuffer.buffer);
    console.timeEnd("convert to PNG");
    factory.clear();

    console.timeEnd("renderContent()");
    return pngData;
  } else if (format.type === "jpeg") {
    console.time("convert to JPEG");
    const jpegDataBuffer = await canvas.encode("jpeg", format.quality * 100);
    const jpegData = new Uint8Array(jpegDataBuffer.buffer);
    console.timeEnd("convert to JPEG");
    factory.clear();

    console.timeEnd("renderContent()");
    return jpegData;
  } else {
    throw new Error(`Unknown format`);
  }
}
