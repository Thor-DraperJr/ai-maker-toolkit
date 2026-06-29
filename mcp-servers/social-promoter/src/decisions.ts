import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type DecisionAction = "posted" | "edited" | "rejected";

export interface DecisionEntry {
    timestamp: string;
    action: DecisionAction;
    draft: string;
    final: string;
    edited: boolean;
    postId?: string;
    postUrl?: string;
    note?: string;
}

export interface VoiceFeedbackPattern {
    type: string;
    description: string;
    count: number;
    examples: string[];
    suggestedVoiceRule: string;
}

export interface VoiceFeedbackReport {
    totalDecisions: number;
    postedCount: number;
    editedCount: number;
    rejectedCount: number;
    patterns: VoiceFeedbackPattern[];
    suggestedAdditions: string[];
    guidance: string;
}

export function decisionsPath(): string {
    return join(homedir(), ".social-promoter", "decisions.jsonl");
}

export function logDecision(entry: DecisionEntry): void {
    try {
        appendFileSync(decisionsPath(), JSON.stringify(entry) + "\n", "utf8");
    } catch {
        // Non-fatal: logging failure must never block publishing.
    }
}

export function readDecisions(): DecisionEntry[] {
    const path = decisionsPath();
    if (!existsSync(path)) return [];
    try {
        return readFileSync(path, "utf8")
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line) as DecisionEntry);
    } catch {
        return [];
    }
}

function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function normalizedEditDistance(draft: string, final: string): number {
    const maxLen = Math.max(draft.length, final.length);
    if (maxLen === 0) return 0;
    return levenshteinDistance(draft, final) / maxLen;
}

export function distillVoiceFeedback(entries: DecisionEntry[]): VoiceFeedbackReport {
    const posted = entries.filter((e) => e.action === "posted");
    const edited = entries.filter((e) => e.edited);
    const rejected = entries.filter((e) => e.action === "rejected");
    const patterns: VoiceFeedbackPattern[] = [];
    const suggestedAdditions: string[] = [];

    // Heavy edits: normalized distance > 0.2 means meaningful rewrite.
    const heavilyEdited = edited.filter((e) => normalizedEditDistance(e.draft, e.final) > 0.2);
    if (heavilyEdited.length >= 2) {
        patterns.push({
            type: "heavy_edits",
            description: `${heavilyEdited.length} draft(s) were substantially rewritten before posting — the agent's voice calibration is missing something.`,
            count: heavilyEdited.length,
            examples: heavilyEdited
                .slice(0, 2)
                .map((e) => `Draft: "${e.draft.slice(0, 80)}..." → Final: "${e.final.slice(0, 80)}..."`),
            suggestedVoiceRule:
                "Review the heavy-edit pairs and extract the consistent change. Add it as an explicit rule or example to voice.md.",
        });
        suggestedAdditions.push(
            "## Patterns from recent edits\n(Fill in: describe what you consistently changed — opening structure, sentence length, specific phrases removed.)",
        );
    }

    // Opening sentence rewrites.
    const openingChanged = edited.filter((e) => {
        const draftFirst = e.draft.split(/[.!?]/)[0]?.trim() ?? "";
        const finalFirst = e.final.split(/[.!?]/)[0]?.trim() ?? "";
        return draftFirst !== finalFirst && draftFirst.length > 10;
    });
    if (openingChanged.length >= 2) {
        patterns.push({
            type: "opening_rewrites",
            description: `Opening sentence was changed in ${openingChanged.length} post(s) — your opening move has a specific shape the agent isn't matching.`,
            count: openingChanged.length,
            examples: openingChanged.slice(0, 2).map((e) => {
                const was = e.draft.split(/[.!?]/)[0]?.trim() ?? "";
                const became = e.final.split(/[.!?]/)[0]?.trim() ?? "";
                return `Was: "${was}" → Became: "${became}"`;
            }),
            suggestedVoiceRule:
                "Add an 'Opening move' section to voice.md: describe how you typically start posts (direct observation, named contrast, concrete fact, etc.).",
        });
        suggestedAdditions.push(
            "## Opening move\nMy posts typically open with: (e.g. 'a direct concrete observation', 'a named contrast between two things', 'a question I genuinely want answered')",
        );
    }

    // High rejection rate.
    if (rejected.length > 0 && entries.length >= 3) {
        const rate = rejected.length / entries.length;
        if (rate >= 0.3) {
            patterns.push({
                type: "high_rejection_rate",
                description: `${Math.round(rate * 100)}% of drafts were rejected — the agent needs more source material or clearer rules.`,
                count: rejected.length,
                examples: rejected.slice(0, 2).map((e) => `"${e.draft.slice(0, 100)}..."`),
                suggestedVoiceRule:
                    "Add more example posts to find_latest_post's sample set, or add explicit 'what I avoid' examples to voice.md.",
            });
        }
    }

    const guidance =
        patterns.length > 0
            ? "Patterns found. Review the suggested additions, edit them to match your real voice, and save to voice.md. The more accurate voice.md is, the better future drafts will match."
            : entries.length < 3
                ? "Not enough decisions logged yet. Post a few more times and run distill_voice_feedback again."
                : "No strong patterns found. Your voice profile appears well-calibrated against recent posts.";

    return {
        totalDecisions: entries.length,
        postedCount: posted.length,
        editedCount: edited.length,
        rejectedCount: rejected.length,
        patterns,
        suggestedAdditions,
        guidance,
    };
}
