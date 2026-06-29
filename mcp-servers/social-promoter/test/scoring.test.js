import assert from "node:assert/strict";
import { test } from "node:test";
import { complianceScore, computeSignals } from "../dist/scoring.js";

test("computeSignals detects URL", () => {
    const s = computeSignals("Check this out https://example.com", 0);
    assert.equal(s.hasUrl, true);
});

test("computeSignals detects soft generalization opener", () => {
    const s = computeSignals("In today's world everything is AI.", 0);
    assert.equal(s.opensWithSoftGeneralization, true);
});

test("computeSignals detects clean opener", () => {
    const s = computeSignals("I shipped a one-drag bundle today.", 0);
    assert.equal(s.opensWithSoftGeneralization, false);
});

test("computeSignals detects context dependency", () => {
    const s = computeSignals("As I mentioned in the post, the bundle is ready.", 0);
    assert.equal(s.hasContextDependency, true);
});

test("computeSignals detects question ending", () => {
    const s = computeSignals("What would you put behind the gate?", 0);
    assert.equal(s.endsWithQuestion, true);
    assert.equal(s.opensWithQuestion, true);
});

test("complianceScore: 0 violations = 10", () => {
    assert.equal(complianceScore([]), 10);
});

test("complianceScore: 1 error = 4", () => {
    assert.equal(complianceScore([{ severity: "error" }]), 4);
});

test("complianceScore: 2 errors = 1", () => {
    assert.equal(complianceScore([{ severity: "error" }, { severity: "error" }]), 1);
});

test("complianceScore: 1 warning = 9 (floor 7)", () => {
    assert.equal(complianceScore([{ severity: "warning" }]), 9);
});

test("complianceScore: 3 warnings = 7 (floor)", () => {
    assert.equal(complianceScore([{ severity: "warning" }, { severity: "warning" }, { severity: "warning" }]), 7);
});
