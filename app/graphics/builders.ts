import { toArray } from "../primitives/iterables";
import {
  Alignment,
  ContentImageItem,
  ContentItem,
  ContentLinearGradientItem,
  ContentRectangleItem,
  ContentHStackItem,
  ContentShapeItem,
  ContentSpacerItem,
  ContentVStackItem,
  ContentTextItem,
  ContentZStackItem,
  FontDefinition,
  InsetDefinition,
  Point2D,
  TextAlignment,
} from "./base";
import { importCanvas } from "./deps";

export function VStack(
  maxWidth = Infinity,
  items: Iterable<ContentItem> | (() => Iterable<ContentItem>),
): ContentVStackItem {
  return Object.freeze({
    type: "vstack",
    items: toArray(items),
    maxWidth,
  });
}

export function HStack(
  options: { maxWidth?: number; alignment?: Alignment; inset?: InsetDefinition; } = {},
  items: Iterable<ContentItem> | (() => Iterable<ContentItem>),
): ContentHStackItem {
  return Object.freeze({
    type: "hstack",
    items: toArray(items),
    alignment: options.alignment,
    maxWidth: options.maxWidth ?? Infinity,
    inset: options.inset ?? 0,
  });
}

export function ZStack(
  maxWidth = Infinity,
  items: Iterable<ContentItem> | (() => Iterable<ContentItem>),
  alignment: Alignment = 'center',
): ContentZStackItem {
  return Object.freeze({
    type: "zstack",
    items: toArray(items),
    alignment,
    maxWidth,
  });
}

export function Spacer(dimension?: number): ContentSpacerItem {
  return Object.freeze({
    type: "spacer",
    dimension,
  });
}

export function Rectangle(width: number, height: number, fillColor: string): ContentRectangleItem {
  return Object.freeze({
    type: "rectangle",
    width,
    height,
    fillColor
  });
}

export function interFontOfSize(
  size: number,
  weight: 400 | 700,
): FontDefinition {
  return Object.freeze({
    face: "Inter",
    size,
    weight,
  });
}

export function Text(
  text: string,
  font: FontDefinition,
  color: string,
  multilineTextAlignment: TextAlignment = 'leading',
): ContentTextItem {
  return Object.freeze({
    type: "text",
    text,
    font,
    color,
    multilineTextAlignment,
  });
}

export async function RemoteImage(source: {
  url: string;
  grow?: boolean;
  maxWidth: number;
  maxHeight?: number;
  rounded?: boolean;
}): Promise<ContentImageItem> {
  // TODO: handle errors.
  const imageBytes = await fetch(source.url).then((res) => res.arrayBuffer());

  const { Image } = await importCanvas();
  const image = new Image();
  image.src = new Buffer(imageBytes);

  return Object.freeze({
    type: "image",
    image,
    grow: source.grow ?? false,
    maxWidth: source.maxWidth,
    rounded: source.rounded ?? false,
  });
}

export function Paths(
  svgPaths: Array<string>,
  options: {
    fillColor: string;
    offsetXFraction?: number;
    offsetYFraction?: number;
    scale?: number;
  },
): ContentShapeItem {
  return Object.freeze({
    type: "shape",
    svgPaths,
    fillColor: options.fillColor,
    offsetXFraction: options.offsetXFraction ?? 0.5,
    offsetYFraction: options.offsetYFraction ?? 0,
    scale: options.scale ?? 1,
  });
}

export function LinearGradient(colors: ReadonlyArray<string>, startPoint: Point2D, endPoint: Point2D): ContentLinearGradientItem {
  return Object.freeze({
    type: "linearGradient",
    colors,
    startPoint,
    endPoint,
  });
}
