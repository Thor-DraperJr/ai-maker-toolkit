import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { VOICE_PROFILE_TEMPLATE, resolveVoiceProfile } from "../dist/voice.js";

function tempDir() {
    return mkdtempSync(join(tmpdir(), "voice-test-"));
}

test("explicit path wins when present", () => {
    const dir = tempDir();
    const explicit = join(dir, "my-voice.md");
    writeFileSync(explicit, "# Explicit voice\nsounds like me");
    const result = resolveVoiceProfile({ explicitPath: explicit, workspaceDir: dir });
    assert.equal(result.found, true);
    assert.equal(result.source, "explicit");
    assert.match(result.content, /Explicit voice/);
});

test("falls back to a workspace file and notes a missing explicit path", () => {
    const dir = tempDir();
    mkdirSync(join(dir, ".social-promoter"));
    writeFileSync(join(dir, ".social-promoter", "voice.md"), "# Workspace voice");
    const result = resolveVoiceProfile({ explicitPath: join(dir, "nope.md"), workspaceDir: dir });
    assert.equal(result.found, true);
    assert.equal(result.source, "workspace");
    assert.ok(result.note, "should note the missing explicit path");
});

test("returns not found with the home path when nothing exists", () => {
    const dir = tempDir();
    const result = resolveVoiceProfile({ workspaceDir: dir });
    assert.equal(result.found, false);
    assert.equal(result.source, "none");
    assert.match(result.path, /\.social-promoter/);
});

test("empty voice files are ignored", () => {
    const dir = tempDir();
    writeFileSync(join(dir, "voice.md"), "   \n  ");
    const result = resolveVoiceProfile({ workspaceDir: dir });
    assert.equal(result.found, false);
});

test("starter template carries the hard voice rules", () => {
    assert.match(VOICE_PROFILE_TEMPLATE, /No em-dashes/);
    assert.match(VOICE_PROFILE_TEMPLATE, /Reference corpus/);
});
