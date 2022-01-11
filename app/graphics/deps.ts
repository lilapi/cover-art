// let cachedPromise: Promise<typeof import("@napi-rs/canvas")> | undefined;

export async function importCanvas(): Promise<typeof import("@napi-rs/canvas")> {
  // Make import dynamic so it doesn’t go through Remix’s build process with esbuild.
  let path = "@napi-rs/canvas";
  // return cachedPromise || (cachedPromise = import(path));
  return import(path);
}
