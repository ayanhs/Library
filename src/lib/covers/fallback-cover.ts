import { deflateSync } from "zlib";

const WIDTH = 640;
const HEIGHT = 960;

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Procedural gradient cover when the image API is unavailable. */
export function createFallbackCoverImage(
  style: string,
  seed: number
): Buffer {
  const hash = Math.abs(
    style.split("").reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), seed)
  );

  const r1 = 40 + (hash % 120);
  const g1 = 30 + ((hash >> 3) % 100);
  const b1 = 60 + ((hash >> 6) % 140);
  const r2 = Math.min(255, r1 + 60 + (hash % 80));
  const g2 = Math.min(255, g1 + 30 + ((hash >> 4) % 60));
  const b2 = Math.min(255, b1 + 40 + ((hash >> 7) % 80));

  const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  let offset = 0;

  for (let y = 0; y < HEIGHT; y++) {
    raw[offset++] = 0;
    const t = y / (HEIGHT - 1);
    const baseR = r1 * (1 - t) + r2 * t;
    const baseG = g1 * (1 - t) + g2 * t;
    const baseB = b1 * (1 - t) + b2 * t;

    for (let x = 0; x < WIDTH; x++) {
      const nx = x / WIDTH - 0.5;
      const ny = y / HEIGHT - 0.5;
      const glow = 1 - 0.35 * (nx * nx + ny * ny);
      const band = 0.15 * Math.sin((x / WIDTH) * Math.PI * 4 + seed * 0.01);
      raw[offset++] = Math.max(0, Math.min(255, Math.round(baseR * glow + band * 40)));
      raw[offset++] = Math.max(0, Math.min(255, Math.round(baseG * glow + band * 20)));
      raw[offset++] = Math.max(0, Math.min(255, Math.round(baseB * glow + band * 30)));
      raw[offset++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
