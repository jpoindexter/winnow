import { describe, it, expect } from "vitest";
import { runFidelity, formatFidelity } from "./fidelity.js";

describe("runFidelity", () => {
  const report = runFidelity();

  it("reports a savings ratio and inline survival per case", () => {
    expect(report.cases.length).toBeGreaterThan(0);
    expect(report.avgRatio).toBeGreaterThan(0);
    expect(report.inlineSurvival).toBeGreaterThanOrEqual(0);
    expect(report.inlineSurvival).toBeLessThanOrEqual(1);
  });

  it("keeps head and tail needles inline", () => {
    expect(report.cases.find((c) => c.id === "json-head")?.inlineSurvived).toBe(true);
    expect(report.cases.find((c) => c.id === "json-tail")?.inlineSurvived).toBe(true);
  });

  it("elides a deep-middle needle inline (recoverable from the store)", () => {
    expect(report.cases.find((c) => c.id === "json-middle")?.inlineSurvived).toBe(false);
  });

  it("renders a readable report", () => {
    const out = formatFidelity(report);
    expect(out).toContain("avg savings");
    expect(out).toContain("recoverable fidelity: 100%");
  });
});
