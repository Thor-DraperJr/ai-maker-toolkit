import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { distillVoiceFeedback } from "../dist/decisions.js";

function tempLog() {
    return join(tmpdir(), `decisions-test-${Date.now()}.jsonl`);
}

function writeJSONL(path, entries) {
    mkdirSync(join(path, ".."), { recursive: true });
    for (const e of entries) appendFileSync(path, JSON.stringify(e) + "\n", "utf8");
}

test("JSONL round-trip parses correctly", () => {
    const p = tempLog();
    writeJSONL(p, [{ timestamp: "2026-01-01T00:00:00.000Z", action: "posted", draft: "hello", final: "hello", edited: false }]);
    const entries = readFileSync(p, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
    assert.equal(entries.length, 1);
    assert.equal(entries[0].action, "posted");
    unlinkSync(p);
});

test("distillVoiceFeedback: not enough data message", () => {
    const report = distillVoiceFeedback([
        { timestamp: "t", action: "posted", draft: "d", final: "d", edited: false },
    ]);
    assert.ok(report.guidance.includes("Not enough"));
    assert.equal(report.totalDecisions, 1);
});

test("distillVoiceFeedback: detects a pattern with opening rewrites", () => {
    const entries = [
        { timestamp: "t", action: "edited", draft: "Genuine question: what do you do?", final: "I moved my tool into a bundle.", edited: true },
        { timestamp: "t", action: "edited", draft: "In today's world this matters.", final: "This session I shipped the bundle.", edited: true },
        { timestamp: "t", action: "posted", draft: "Good post.", final: "Good post.", edited: false },
    ];
    const report = distillVoiceFeedback(entries);
    const types = report.patterns.map((p) => p.type);
    assert.ok(types.includes("opening_rewrites") || types.includes("heavy_edits"), "should detect a pattern");
});

test("distillVoiceFeedback: counts correctly", () => {
    const entries = [
        { timestamp: "t", action: "posted", draft: "d", final: "d", edited: false },
        { timestamp: "t", action: "edited", draft: "d", final: "f", edited: true },
        { timestamp: "t", action: "rejected", draft: "d", final: "d", edited: false },
    ];
    const report = distillVoiceFeedback(entries);
    assert.equal(report.postedCount, 1);
    assert.equal(report.editedCount, 1);
    assert.equal(report.rejectedCount, 1);
    assert.equal(report.totalDecisions, 3);
});

test("distillVoiceFeedback: high rejection rate flagged", () => {
    const entries = [
        { timestamp: "t", action: "rejected", draft: "d", final: "d", edited: false },
        { timestamp: "t", action: "rejected", draft: "d2", final: "d2", edited: false },
        { timestamp: "t", action: "posted", draft: "p", final: "p", edited: false },
        { timestamp: "t", action: "posted", draft: "p2", final: "p2", edited: false },
    ];
    const report = distillVoiceFeedback(entries);
    const types = report.patterns.map((p) => p.type);
    assert.ok(types.includes("high_rejection_rate"));
});
