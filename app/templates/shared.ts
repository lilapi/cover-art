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

export function readLogo(query: ParamsReader) {
  let logoImageURL = query.string("logo");
  const logoImagePosition = query.string("logo-pos", "topLeft");
  if (logoImageURL === "test1") {
    logoImageURL = "https://github.com/littleeagleio.png";
  } else if (logoImageURL === "test2") {
    logoImageURL = "https://raw.githubusercontent.com/google/material-design-icons/master/png/maps/pedal_bike/materialiconstwotone/48dp/2x/twotone_pedal_bike_black_48dp.png";
  }

  return Object.freeze({ logoImageURL, logoImagePosition });
}
