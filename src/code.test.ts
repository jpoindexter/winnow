import { describe, it, expect } from "vitest";
import { compressCode, isCodeContent } from "./code.js";

describe("isCodeContent", () => {
  it("recognizes TS/JS source", () => {
    expect(isCodeContent("export function f() { return 1; }")).toBe(true);
    expect(isCodeContent("just prose, no code")).toBe(false);
  });
});

describe("compressCode", () => {
  it("strips function/method bodies but keeps signatures", async () => {
    const src = [
      "export function add(a: number, b: number): number {",
      "  const sum = a + b;",
      "  return sum;",
      "}",
      "export class C {",
      "  method(x: string) {",
      "    console.log(x);",
      "    return x.length;",
      "  }",
      "}",
    ].join("\n");
    const out = await compressCode(src);
    expect(out).not.toBeNull();
    expect(out).toContain("export function add(a: number, b: number): number");
    expect(out).toContain("method(x: string)");
    expect(out).toContain("body elided");
    expect(out).not.toContain("const sum = a + b");
    expect(out!.length).toBeLessThan(src.length);
  });

  it("returns null when there's nothing to strip", async () => {
    expect(await compressCode("const x = 1;")).toBeNull();
  });
});
