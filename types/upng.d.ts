declare module "upng-js" {
  const UPNG: {
    /** cnum = 0 for lossless, else max colours in the palette (lossy). */
    encode(frames: ArrayBuffer[], w: number, h: number, cnum: number, delays?: number[]): ArrayBuffer;
  };
  export default UPNG;
}
