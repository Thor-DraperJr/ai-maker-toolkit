import assert from "node:assert/strict";
import { test } from "node:test";
import { lintVoice } from "../dist/lint.js";

test("clean post passes", () => {
    const result = lintVoice("A short, clean operator note about agents and approval gates.");
    assert.equal(result.ok, true);
    assert.equal(result.violations.length, 0);
});

test("flags em-dash", () => {
    const result = lintVoice("This is the point \u2014 and it matters.");
    assert.equal(result.ok, false);
    assert.ok(result.violations.some((v) => v.rule === "em-dash"));
});

test("flags banned phrase", () => {
    const result = lintVoice("The goal is simple: ship the thing.");
    assert.ok(result.violations.some((v) => v.rule === "banned-phrase"));
});

test("flags negative clarification", () => {
    const result = lintVoice("This is not autopilot. It is an approval gate.");
    assert.ok(result.violations.some((v) => v.rule === "negative-clarification"));
});

test("flags emoji", () => {
    const result = lintVoice("Shipping today \uD83D\uDE80 big news.");
    assert.ok(result.violations.some((v) => v.rule === "emoji"));
});

test("flags over-length", () => {
    const result = lintVoice("a".repeat(300));
    assert.ok(result.violations.some((v) => v.rule === "length"));
});
