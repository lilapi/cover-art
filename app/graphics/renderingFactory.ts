import type { AsyncReturnType } from "type-fest";
import type { Path2D, SKRSContext2D } from "@napi-rs/canvas";
import { MemoizedCalculator } from "../primitives/caching";
import { ContentTextItem, FontDefinition } from "./base";
import { importCanvas } from "./deps";
import { maxBy, sumBy, toArray } from "~/primitives/iterables";

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
  const text = textContent.text.trim();

  let lineMetrics: Array<LineMetric> = [];

  function layout(measure: number) {
    if (measure < 1) {
      lineMetrics = [];
      return;
    }

    // TODO: handle wider characters like emoji.
    // FIXME: breaks on: http://localhost:3000/1/plain?t1=Your+logo+here&t1-size=32&t1-color=%23447aa6&t2=Generic+white+t-shirt+%E2%80%94+20%25+summer+sale&t2-size=36&t2-color=%2326618b&w=800&h=420&bg-color=%23f6f6f6&img=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1521572163474-6864f9cf17ab%3Fixlib%3Drb-1.2.1%26ixid%3DMnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8%26auto%3Dformat%26fit%3Dcrop%26w%3D800%26q%3D80&img-pos=left
    let startUTF16 = 0;
    let endUTF16 = text.length;
    let startUTF8 = 0;
    const utf8Encoder = new TextEncoder();

    lineMetrics = toArray(function* () {
      applyFont(ctx, textContent.font);

      let lineNumber = 0;
      while (startUTF16 < endUTF16) {
        let substring = text.slice(startUTF16, endUTF16);
        // Skip leading whitespace.
        while (substring.startsWith(" ")) {
          startUTF16++;
          startUTF8++;
          substring = text.slice(startUTF16, endUTF16);
        }
        const metrics = ctx.measureText(substring);
        console.log("measure text", measure, metrics.width, substring);
        if (metrics.width > measure) {
          if (substring.includes(" ")) {
            const lastWhitespaceMatch = substring.match(/[ ](\S)+$/);
            if (lastWhitespaceMatch?.index != null) {
              endUTF16 = lastWhitespaceMatch.index + startUTF16;
              continue;
            }
          }

          endUTF16--;
          continue;
        }

        const utf8Encoded = utf8Encoder.encode(substring);

        const left = textContent.multilineTextAlignment === "trailing"
          ? measure - metrics.width
          : textContent.multilineTextAlignment === "center"
          ? (measure - metrics.width) / 2
          : 0;
        // const left = 0;

        console.log("LINE OF TEXT", { startUTF8, startUTF16, endUTF16 }, metrics, { measure }, substring);
        yield {
          lineNumber,
          startIndex: startUTF8,
          endIndex: startUTF8 + utf8Encoded.length,
          endExcludingWhitespaces: startUTF8 + utf8Encoded.length,
          ascent: metrics.fontBoundingBoxAscent,
          descent: metrics.fontBoundingBoxDescent,
          height: Math.round(
            metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent,
            // metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
          ),
          width: metrics.width,
          left,
          baseline: metrics.fontBoundingBoxAscent +
            metrics.fontBoundingBoxDescent, // FIXME
        } as LineMetric;

        lineNumber += 1;
        startUTF16 = endUTF16;
        endUTF16 = text.length;
        console.log("LINE OF TEXT yielded", {
          startUTF8,
          startUTF16,
          endUTF16,
        });
        startUTF8 += utf8Encoded.length;
      }
    });
  }

  return Object.freeze({
    layout,
    getLineMetrics() {
      return lineMetrics;
    },
    getLongestLine() {
      return maxBy(lineMetrics, m => m.width);
    },
    getHeight() {
      return sumBy(lineMetrics, (m) => m.height);
    },
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
    paragraphForTextContent: (textContent) =>
      textContentParagraphCache.get(textContent),
    makePath: (source) => new canvas.Path2D(source),
    clear,
  });
}
