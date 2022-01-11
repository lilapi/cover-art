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
  const line1Size = query.int("t1-size", 36); // Should it be called t1-px instead?
  const line1Color = query.string("t1-color", "white");
  const line2 = query.string("t2", "");
  const line2Size = query.int("t2-size", 24);
  const line2Color = query.string("t2-color", "white");

  return Object.freeze({
    line1,
    line1Size,
    line1Color,
    line2,
    line2Size,
    line2Color,
  });
}
