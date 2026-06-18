import { describe, it, expect } from "vitest";
import { classifyBackbone, resolveDelivery, WEAK_INLINE_CHARS, FILE_PREVIEW_CHARS } from "./delivery.js";

describe("classifyBackbone", () => {
  it("treats frontier/large models as strong", () => {
    for (const m of ["gpt-4o", "claude-opus-4-8", "deepseek-v3", "qwen2.5:72b", "gemini-2.5-pro", "", "future-model"]) {
      expect(classifyBackbone(m)).toBe("strong");
    }
  });
  it("treats small/distilled models as weak", () => {
    for (const m of ["gpt-4o-mini", "o3-mini", "claude-haiku-4-5", "gemma-7b", "llama-3.1-8b"]) {
      expect(classifyBackbone(m)).toBe("weak");
    }
  });
});

describe("resolveDelivery", () => {
  it("strong → file with a short preview, weak → inline with a larger window", () => {
    expect(resolveDelivery({ modelId: "gpt-4o" })).toEqual({ mode: "file", inlineChars: FILE_PREVIEW_CHARS });
    expect(resolveDelivery({ modelId: "gpt-4o-mini" })).toEqual({ mode: "inline", inlineChars: WEAK_INLINE_CHARS });
  });
  it("honors a forced mode", () => {
    expect(resolveDelivery({ modelId: "gpt-4o", force: "inline" }).mode).toBe("inline");
  });
});
