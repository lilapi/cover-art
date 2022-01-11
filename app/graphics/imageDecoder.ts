import { ImagePool } from "@squoosh/lib";
import { cpus } from "os";
const imagePool = new ImagePool(cpus().length);

export async function decodeImageData(
  data: ArrayBuffer,
): Promise<
  { bitmap: { data: Uint8ClampedArray; width: number; height: number }; size: number }
> {
  const image = imagePool.ingestImage(data);
  return await image.decoded;
}
