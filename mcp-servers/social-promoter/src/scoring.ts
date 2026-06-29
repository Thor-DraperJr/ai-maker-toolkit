/**
 * Scoring rubric and draft signals for multi-dimension post evaluation.
 *
 * The five dimensions require semantic judgment (voice match, specificity, etc.).
 * The model does the scoring; this module provides deterministic signals as
 * factual grounding and a structured rubric so every evaluation is consistent.
 * The article insight: evaluators are the ceiling — clear criteria produce
 * better calibration than vague instructions.
 */

export interface DraftSignals {
    charCount: number;
    hasUrl: boolean;
    violationCount: number;
    opensWithQuestion: boolean;
    opensWithSoftGeneralization: boolean;
    endsWithQuestion: boolean;
    sentenceCount: number;
    avgSentenceLengthWords: number;
    hasContextDependency: boolean;
}

export interface ScoringDimension {
    name: string;
    description: string;
    criteria: string[];
    antiPatterns: string[];
    scoringNote: string;
}

export interface ScoringRubric {
    dimensions: Record<string, ScoringDimension>;
    instructions: string;
}

export const SCORING_RUBRIC: ScoringRubric = {
    instructions:
        "Score each dimension 1–10. 1–4 = misses the mark, 5–6 = acceptable, 7–8 = good, 9–10 = excellent. Be calibrated: a 9 is rare. Use the author's voice profile content and the signals object as factual grounding.",
    dimensions: {
        voice_match: {
            name: "Voice match",
            description: "Does the draft sound like this specific author, not like generic competent AI?",
            criteria: [
                "Opening move matches the author's typical pattern (direct observation, concrete fact, named contrast)",
                "Sentence rhythm and length match the author's corpus",
                "Word choices reflect the author's actual diction (check voice.md and tone samples)",
                "Structural devices match (decision rules, ladders, scorecards if present in their writing)",
            ],
            antiPatterns: [
                "Soft generalization opener ('The current landscape...', 'In today's world...')",
                "Generic hype vocabulary ('game-changer', 'exciting times', 'cutting-edge')",
                "AI-accent phrases ('delve', 'It is worth noting', 'importantly', 'at the end of the day')",
                "Em-dashes or emoji if prohibited in voice.md",
            ],
            scoringNote:
                "Compare the draft's opening, rhythm, and diction directly against the voice profile and tone samples. AI-accent phrases or generic openers = low score.",
        },
        standalone: {
            name: "Standalone readability",
            description: "Does the post land on its own before any link earns the click?",
            criteria: [
                "A reader with no prior context understands the point",
                "The value is in the post itself, not deferred to a link",
                "No dangling references ('as I mentioned', 'in the post above')",
                "Ends with something complete — a point, a question, a takeaway — not just a teaser",
            ],
            antiPatterns: [
                "Cliff-hanger that only resolves at the link",
                "Context-dependent phrases ('as you know', 'following up on')",
                "Post is only an announcement with no idea in it",
            ],
            scoringNote:
                "Cover the link mentally. Does the post still make a complete point? Yes = high. Requires the link to make sense = low. Use hasContextDependency signal as a flag.",
        },
        specificity: {
            name: "Specificity",
            description: "Is the claim concrete and grounded, or vague and generic?",
            criteria: [
                "Names a specific thing, number, decision, or observation",
                "Could only have been written by someone who actually did this work",
                "Avoids category-level generalities",
            ],
            antiPatterns: [
                "Could apply to any project or any person",
                "No concrete noun, number, or named artifact",
                "Reads like a thought-leadership template",
            ],
            scoringNote:
                "Ask: could this exact text appear on any random engineer's feed? If yes, specificity is low. Requires the author's specific context = high. Use opensWithSoftGeneralization signal.",
        },
        conversation_pull: {
            name: "Conversation pull",
            description: "Does it invite a genuine reply or just broadcast?",
            criteria: [
                "Ends with a question the author genuinely wants answered, or a provocation that invites pushback",
                "The question is specific enough that a thoughtful person could answer it",
                "Feels like the start of a conversation, not a press release",
            ],
            antiPatterns: [
                "Generic call-to-action ('What do you think?', 'Thoughts?')",
                "No invitation at all — pure declaration",
                "Question is rhetorical with an obvious answer",
            ],
            scoringNote:
                "Conversation variants should score highest here. Insight and Launch variants may score 5–7 by design — they are not required to ask a question. Use endsWithQuestion signal.",
        },
        compliance: {
            name: "Rule compliance",
            description: "Does the draft follow the author's hard voice rules?",
            criteria: [
                "No error-level lint violations",
                "Within character limit",
                "No banned phrases",
            ],
            antiPatterns: ["Any error-level lint violation", "Over character limit"],
            scoringNote:
                "Derive directly from lint result: 0 violations = 10, 1 error = 4, 2+ errors = 1. Warning-level = subtract 1 per warning (floor 7 if no errors). Use violationCount signal.",
        },
    },
};

const SOFT_GENERALIZATION = [
    /^(in today|in the current|the current|as (we|ai|technology)|if you.re building|one of the)/i,
    /^(the (hard|interesting|important|real|key|true|honest|biggest|most|main) (part|thing|question|lesson|challenge|difference|problem))/i,
    /^(most teams|many teams|most people|everyone knows|we all know)/i,
];

const CONTEXT_DEPENDENCY = [
    /as i (mentioned|wrote|described|explained|said)/i,
    /in (the|my|this) (post|article|thread|blog)/i,
    /following up on/i,
    /as you (know|saw|read)/i,
];

export function computeSignals(text: string, violationCount: number): DraftSignals {
    const sentences = text
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    const sentenceWordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
    const avgSentenceLengthWords =
        sentenceWordCounts.length > 0
            ? Math.round((sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length) * 10) / 10
            : 0;
    const firstSentenceMatch = text.match(/^[^.!?]+[.!?]/);
    const firstSentenceEnd = firstSentenceMatch ? firstSentenceMatch[0].trimEnd().slice(-1) : "";
    const lastChar = text.trimEnd().slice(-1);

    return {
        charCount: text.length,
        hasUrl: /https?:\/\//i.test(text),
        violationCount,
        opensWithQuestion: firstSentenceEnd === "?",
        opensWithSoftGeneralization: SOFT_GENERALIZATION.some((p) => p.test(text.trim())),
        endsWithQuestion: lastChar === "?",
        sentenceCount: sentences.length,
        avgSentenceLengthWords,
        hasContextDependency: CONTEXT_DEPENDENCY.some((p) => p.test(text)),
    };
}

/** Derive the compliance score deterministically from the violation count. */
export function complianceScore(violations: { severity: string }[]): number {
    const errors = violations.filter((v) => v.severity === "error").length;
    const warnings = violations.filter((v) => v.severity === "warning").length;
    if (errors >= 2) return 1;
    if (errors === 1) return 4;
    return Math.max(7, 10 - warnings);
}
