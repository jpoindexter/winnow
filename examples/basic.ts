// Run with: npx tsx examples/basic.ts
import { compress, retrieve, stats, alignSegments } from "../src/index.js";

// 1. Compress a fat tool output, reversibly.
const rows = Array.from({ length: 200 }, (_, i) => ({ id: i, name: `row-${i}`, status: "active" }));
const huge = JSON.stringify(rows);

const r = await compress(huge);
console.log("compressed:", r.compressed, "| content:", r.contentType);
console.log(stats(huge, r.text)); // tokensBefore/After/Saved/ratio

// 2. The original is one call away when the model needs detail.
if (r.originalId) {
  const original = await retrieve(r.originalId);
  console.log("recovered original matches:", original === huge);
}

// 3. Cache-align a tiered prompt so a volatile clock doesn't bust the KV cache.
const aligned = alignSegments([
  { id: "clock", text: `time: ${new Date().toISOString()}`, stable: false },
  { id: "system", text: "You are a helpful agent.", stable: true },
  { id: "tools", text: "[tool catalog]", stable: true },
]);
console.log("moved volatile segments:", aligned.movedVolatile); // ["clock"]
console.log("stable-prefix cacheKey:", aligned.cacheKey);
