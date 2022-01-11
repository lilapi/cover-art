import type { AsyncReturnType } from "type-fest";
import type { Path2D, SKRSContext2D } from "@napi-rs/canvas";
import { MemoizedCalculator } from "../primitives/caching";
import { ContentTextItem, FontDefinition } from "./base";
import { importCanvas } from "./deps";
import { toArray } from "~/primitives/iterables";

export const COLORS = Object.freeze({
  black: Float32Array.of(0, 0, 0, 1),
  white: Float32Array.of(1, 1, 1, 1),
  red: Float32Array.of(1, 0, 0, 1),
  yellow: Float32Array.of(1, 1, 0, 1),
});

export interface RenderingFactory {
  paragraphForTextContent(textContent: ContentTextItem): Paragraph;
  makePath(svgString: string): Path2D;

  clear(): void;
}

interface LineMetric {
  /** The index in the text buffer the line begins. */
  startIndex: number;
  /** The index in the text buffer the line ends. */
  endIndex: number;
  endExcludingWhitespaces: number;
  endIncludingNewline: number;
  /** True if the line ends in a hard break (e.g. newline) */
  isHardBreak: boolean;
  /**
   * The final computed ascent for the line. This can be impacted by
   * the strut, height, scaling, as well as outlying runs that are very tall.
   */
  ascent: number;
  /**
   * The final computed descent for the line. This can be impacted by
   * the strut, height, scaling, as well as outlying runs that are very tall.
   */
  descent: number;
  /** round(ascent + descent) */
  height: number;
  /** width of the line */
  width: number;
  /** The left edge of the line. The right edge can be obtained with `left + width` */
  left: number;
  /** The y position of the baseline for this line from the top of the paragraph. */
  baseline: number;
  /** Zero indexed line number. */
  lineNumber: number;
}

interface Paragraph {
  getLineMetrics(): Array<LineMetric>;
  getLongestLine(): number;
  getHeight(): number;
  layout(measure: number): void;
}

export function applyFont(ctx: SKRSContext2D, font: FontDefinition) {
  ctx.font = `${font.weight} ${font.size}px ${font.face}`;
}

function paragraphForTextContent(
  textContent: ContentTextItem,
  ctx: SKRSContext2D,
): Paragraph {
  console.log("paragraphForTextContent", textContent);
  const { text, font } = textContent;
  ctx.fillStyle = textContent.color;
  applyFont(ctx, font);

  const lineMetrics = toArray(function* () {
    console.log("measure text", text);
    const metrics = ctx.measureText(text);
    yield {
      lineNumber: 0,
      startIndex: 0,
      endIndex: text.length,
      ascent: metrics.fontBoundingBoxAscent,
      descent: metrics.fontBoundingBoxDescent,
      height: Math.round(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent),
      width: metrics.width,
      left: 0,
      baseline: metrics.fontBoundingBoxAscent // FIXME
    } as LineMetric;
  });

  return Object.freeze({
    getLineMetrics() {
      return lineMetrics;
    },
    getLongestLine() {
      return lineMetrics[0].width;
    },
    getHeight() {
      return lineMetrics[0].height;
    },
    layout() {}
  });
}

export function makeRenderingFactory(
  canvas: AsyncReturnType<typeof importCanvas>,
  ctx: SKRSContext2D,
): RenderingFactory {
  const textContentParagraphCache = new MemoizedCalculator<
    ContentTextItem,
    Paragraph
  >((textContent) => paragraphForTextContent(textContent, ctx));

  function clear() {
    textContentParagraphCache.clear();
  }

  return Object.freeze({
    paragraphForTextContent: (textContent) => textContentParagraphCache.get(textContent),
    makePath: (source) => new canvas.Path2D(source),
    clear,
  });
}
