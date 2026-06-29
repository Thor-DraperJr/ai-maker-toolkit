export interface LintRules {
    characterLimit: number;
    allowEmoji: boolean;
    allowEmDash: boolean;
    bannedPhrases: string[];
}

export const DEFAULT_RULES: LintRules = {
    characterLimit: 280,
    allowEmoji: false,
    allowEmDash: false,
    bannedPhrases: [
        "the goal is simple",
        "in today's fast-paced world",
        "at the end of the day",
        "let's dive in",
        "game changer",
        "game-changer",
        "unlock",
        "supercharge",
        "in this day and age",
        "needle-moving",
        "move the needle",
    ],
};

export interface LintViolation {
    rule: string;
    severity: "error" | "warning";
    detail: string;
    match?: string;
}

export interface LintResult {
    ok: boolean;
    characterCount: number;
    characterLimit: number;
    violations: LintViolation[];
}

// Em-dash and en-dash used as sentence punctuation.
const DASH_PATTERN = /[\u2014\u2013]/g;
// Extended pictographic covers most emoji.
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;
// "not X, it's Y" / "not X. It is Y" / "isn't X, it's Y" style negative clarifications.
const NEGATIVE_CLARIFICATION_PATTERN =
    /\b(?:is|are|it'?s|that'?s|was|were)?\s*\bnot\b[^.?!]{0,70}?[,.]\s*(?:it'?s|it is|they'?re|but|rather|instead)\b/gi;

export function lintVoice(text: string, overrides: Partial<LintRules> = {}): LintResult {
    const rules: LintRules = { ...DEFAULT_RULES, ...overrides };
    const violations: LintViolation[] = [];
    const characterCount = [...text].length;

    if (characterCount > rules.characterLimit) {
        violations.push({
            rule: "length",
            severity: "error",
            detail: `Post is ${characterCount}/${rules.characterLimit} characters.`,
        });
    }

    if (!rules.allowEmDash) {
        for (const match of text.matchAll(DASH_PATTERN)) {
            violations.push({
                rule: "em-dash",
                severity: "error",
                detail: "Em/en dash used as punctuation. Use a period, comma, or rewrite.",
                match: match[0],
            });
        }
    }

    if (!rules.allowEmoji) {
        for (const match of text.matchAll(EMOJI_PATTERN)) {
            violations.push({
                rule: "emoji",
                severity: "error",
                detail: "Emoji are not allowed.",
                match: match[0],
            });
        }
    }

    const lowered = text.toLowerCase();
    for (const phrase of rules.bannedPhrases) {
        const index = lowered.indexOf(phrase.toLowerCase());
        if (index !== -1) {
            violations.push({
                rule: "banned-phrase",
                severity: "error",
                detail: `Banned AI-accent phrase: "${phrase}".`,
                match: text.slice(index, index + phrase.length),
            });
        }
    }

    for (const match of text.matchAll(NEGATIVE_CLARIFICATION_PATTERN)) {
        violations.push({
            rule: "negative-clarification",
            severity: "warning",
            detail: "Reads as a 'not X, it's Y' clarification. State the positive claim directly.",
            match: match[0].trim(),
        });
    }

    return {
        ok: violations.filter((v) => v.severity === "error").length === 0,
        characterCount,
        characterLimit: rules.characterLimit,
        violations,
    };
}
