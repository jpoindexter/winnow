import { describe, it, expect } from "vitest";
import { squashLogs } from "./log-squash.js";

describe("squashLogs", () => {
  it("collapses consecutive duplicate lines", () => {
    const out = squashLogs(["a", "a", "a", "b"].join("\n"));
    expect(out).toContain("a (×3)");
    expect(out).toContain("b");
  });

  it("collapses deep stack traces to the top frames", () => {
    const frames = Array.from({ length: 20 }, (_, i) => `    at frame${i} (file.js:${i})`);
    const out = squashLogs(["Error: boom", ...frames].join("\n"));
    expect(out).toContain("more frames");
    expect(out.split("\n").length).toBeLessThan(22);
  });

  it("collapses runs of blank lines", () => {
    const out = squashLogs(["x", "", "", "", "y"].join("\n"));
    expect(out).toBe(["x", "", "y"].join("\n"));
  });
});
