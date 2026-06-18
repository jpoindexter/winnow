import { describe, it, expect } from "vitest";
import { detectContentType, compressText, binaryStub } from "./router.js";

describe("detectContentType", () => {
  it("detects json, logs, text, and binary", () => {
    expect(detectContentType('{"a":1}')).toBe("json");
    expect(detectContentType("2024-01-01 ERROR boom")).toBe("logs");
    expect(detectContentType("just some prose")).toBe("text");
    expect(detectContentType("\x00\x01\x02\x00\x01\x02".repeat(50))).toBe("binary");
  });

  it("falls back to text for json-looking-but-invalid", () => {
    expect(detectContentType("{ not really json")).toBe("text");
  });
});

describe("compressText", () => {
  it("is a no-op below the token floor", () => {
    const r = compressText("small", { minTokens: 400 });
    expect(r.compressed).toBe(false);
    expect(r.text).toBe("small");
  });

  it("shrinks a large object array", () => {
    const big = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `n${i}` })));
    const r = compressText(big);
    expect(r.compressed).toBe(true);
    expect(r.contentType).toBe("json");
    expect(r.tokensAfter).toBeLessThan(r.tokensBefore);
  });

  it("elides a binary blob to a stub", () => {
    const blob = "\x00\xff".repeat(5000);
    const r = compressText(blob);
    expect(r.text).toContain("binary/non-text content elided");
  });
});

describe("binaryStub", () => {
  it("reports the elided length", () => {
    expect(binaryStub("xxxxx")).toContain("5 chars");
  });
});
