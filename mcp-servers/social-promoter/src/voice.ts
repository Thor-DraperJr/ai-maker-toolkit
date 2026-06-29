import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Resolution layer for a maintained "voice profile" file: a human-authored
 * document that describes how the author writes (traits, structure, signature
 * devices, banned phrasing). The model uses it to sound like the author instead
 * of inferring voice from word-frequency heuristics.
 *
 * Resolution order (most specific wins): an explicit path the caller passes,
 * then a file in the current workspace, then a global file in the home directory
 * that travels with the author across every repo (the same model credentials use).
 */
export type VoiceFileSource = "explicit" | "workspace" | "home" | "none";

export interface VoiceProfile {
    found: boolean;
    source: VoiceFileSource;
    /** The resolved path when found, otherwise the home-dir path where one should be created. */
    path: string;
    content: string;
    /** Populated when an explicit path was given but did not exist (a likely typo). */
    note?: string;
}

/** Filenames searched inside a workspace directory, in priority order. */
const WORKSPACE_CANDIDATES = [
    ".social-promoter/voice.md",
    ".social-promoter/voice-profile.md",
    "voice-profile.md",
    "VOICE.md",
    "voice.md",
];

/** The global voice file that travels with the author across every repo. */
export function homeVoicePath(): string {
    return join(homedir(), ".social-promoter", "voice.md");
}

function readIfPresent(path: string): string | null {
    if (!existsSync(path)) {
        return null;
    }
    try {
        const content = readFileSync(path, "utf8");
        return content.trim() ? content : null;
    } catch {
        return null;
    }
}

export interface ResolveVoiceOptions {
    /** An explicit voice file path (highest priority). */
    explicitPath?: string;
    /** Directory to search for a workspace-local voice file (defaults to cwd by the caller). */
    workspaceDir?: string;
}

/**
 * Resolve the maintained voice profile.
 * Order: explicit path -> workspace file -> home-dir file. Returns found: false
 * with the home-dir path (where one should be created) when none exists.
 */
export function resolveVoiceProfile(options: ResolveVoiceOptions = {}): VoiceProfile {
    const { explicitPath, workspaceDir } = options;
    let note: string | undefined;

    if (explicitPath) {
        const content = readIfPresent(explicitPath);
        if (content !== null) {
            return { found: true, source: "explicit", path: explicitPath, content };
        }
        note = `Explicit voiceFile "${explicitPath}" was not found or was empty; fell back to workspace and home lookups.`;
    }

    if (workspaceDir) {
        for (const relative of WORKSPACE_CANDIDATES) {
            const candidate = join(workspaceDir, relative);
            const content = readIfPresent(candidate);
            if (content !== null) {
                return { found: true, source: "workspace", path: candidate, content, ...(note ? { note } : {}) };
            }
        }
    }

    const home = homeVoicePath();
    const homeContent = readIfPresent(home);
    if (homeContent !== null) {
        return { found: true, source: "home", path: home, content: homeContent, ...(note ? { note } : {}) };
    }

    return { found: false, source: "none", path: home, content: "", ...(note ? { note } : {}) };
}

/**
 * A ready-to-save starter voice profile. Returned by get_voice_profile when no
 * file is found so the agent can offer to write one. Adopters fill in their own
 * traits; the structure is what makes the model match a real person.
 */
export const VOICE_PROFILE_TEMPLATE = `# Voice Profile

A description of how I write so an agent can draft in my voice. Keep this in your
own words and update it as your writing evolves. Drafting reads this; it never
invents a voice you have not described here.

## Who I am writing as
- Role / how I want to be seen (e.g. "operator and future tech leader, writing for a CIO/CISO/VP audience").
- One line on the perspective I write from (operator/coach, not vendor/seller).

## Voice traits (keep)
- Direct, conversational, practical.
- Confident without sounding stiff or inflated.
- Structured around a clear takeaway, a mental model, or a usable next move.
- Sounds like a real person, not a polished brand deck.

## Structure and signature devices
- How I open (a concrete hook, a personal stance, a question).
- Devices I reach for (mental models, ladders/levels, decision rules, short scorecards).
- How I close (a grounded forward-looking line, often a real question to the reader).

## Diction
- Words and framings I use.
- Words and framings I avoid.

## Hard rules (never)
- No emoji.
- No em-dashes or en-dashes used as punctuation.
- No "not X, it's Y" negative clarifications. State the positive claim.
- No AI-accent filler ("the goal is simple", "in today's fast-paced world", "game changer", "unlock").
- No customer names, internal roadmap dates, or unreleased details.

## Reference corpus
- Where my real writing lives (e.g. a posts directory) so the agent can sample full posts to calibrate.
`;
