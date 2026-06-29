import { TwitterApi } from "twitter-api-v2";
import { getCredentials } from "./credentials.js";
import { logDecision } from "./decisions.js";

export interface CostSettings {
    textOnlyUsd: number;
    withUrlUsd: number;
}

export const DEFAULT_COST: CostSettings = {
    textOnlyUsd: 0.015,
    withUrlUsd: 0.2,
};

const URL_PATTERN = /https?:\/\//i;

export interface CostEstimate {
    hasUrl: boolean;
    tier: "text-only" | "with-url";
    estimatedUsd: number;
}

export function estimateCost(text: string, overrides: Partial<CostSettings> = {}): CostEstimate {
    const costs: CostSettings = { ...DEFAULT_COST, ...overrides };
    const hasUrl = URL_PATTERN.test(text);
    return {
        hasUrl,
        tier: hasUrl ? "with-url" : "text-only",
        estimatedUsd: hasUrl ? costs.withUrlUsd : costs.textOnlyUsd,
    };
}

export interface PublishResult {
    status: "posted" | "dry-run" | "blocked" | "error";
    posted: boolean;
    message: string;
    text: string;
    cost: CostEstimate;
    url?: string;
}

function mapError(error: unknown): string {
    const err = error as { code?: number; data?: { title?: string; reason?: string }; message?: string };
    if (err?.code === 402 && err?.data?.title === "CreditsDepleted") {
        return "X API credits are depleted. Add prepaid credits before posting.";
    }
    if (err?.code === 403 && err?.data?.reason === "client-not-enrolled") {
        return "Developer app is not enrolled for posting. Verify app/project enrollment and token permissions.";
    }
    if (err?.data) {
        return `X API error: ${JSON.stringify(err.data)}`;
    }
    return `X API error: ${err?.message ?? "Unknown error"}`;
}

export interface PublishOptions {
    confirmed: boolean;
    dryRun?: boolean;
    costOverrides?: Partial<CostSettings>;
    /** Original agent-generated draft, if the user edited the text before approving. Used for decision logging. */
    originalDraft?: string;
}

/**
 * Publish an approved post to X. Guarded by an explicit approval gate:
 * - `confirmed` must be true (set only after the user approves the exact text and cost tier).
 * - `dryRun` (or missing credentials) performs no network call and reports what would happen.
 * Live posting requires X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET in the environment.
 */
export async function publishPost(text: string, options: PublishOptions): Promise<PublishResult> {
    const cost = estimateCost(text, options.costOverrides);

    if (!options.confirmed) {
        return {
            status: "blocked",
            posted: false,
            message:
                "Publishing requires confirmed: true after the user approves the exact text and cost tier. No action taken.",
            text,
            cost,
        };
    }

    const credentials = getCredentials();

    if (options.dryRun || !credentials) {
        const reason = options.dryRun
            ? "Dry run requested."
            : "No X credentials found. Run `npx social-promoter-mcp login` to connect your X account.";
        return {
            status: "dry-run",
            posted: false,
            message: `${reason} Would publish a ${cost.tier} post for an estimated $${cost.estimatedUsd.toFixed(3)}. No request sent.`,
            text,
            cost,
        };
    }

    try {
        const client = new TwitterApi(credentials);
        const response = await client.v2.tweet(text);
        const postId = response?.data?.id;
        if (!postId) {
            return {
                status: "error",
                posted: false,
                message: "Post request returned no id. Treat as failed and verify before retrying.",
                text,
                cost,
            };
        }
        const postUrl = `https://x.com/i/status/${postId}`;
        logDecision({
            timestamp: new Date().toISOString(),
            action: "posted",
            draft: options.originalDraft ?? text,
            final: text,
            edited: options.originalDraft !== undefined && options.originalDraft !== text,
            postId,
            postUrl,
        });
        return {
            status: "posted",
            posted: true,
            message: `Posted a ${cost.tier} post (est. $${cost.estimatedUsd.toFixed(3)}).`,
            text,
            cost,
            url: postUrl,
        };
    } catch (error) {
        return {
            status: "error",
            posted: false,
            message: mapError(error),
            text,
            cost,
        };
    }
}
