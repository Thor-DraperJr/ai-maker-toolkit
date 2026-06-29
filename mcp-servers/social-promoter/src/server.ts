import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getServerDefaults } from "./config.js";
import { DecisionAction, distillVoiceFeedback, logDecision, readDecisions } from "./decisions.js";
import { lintVoice } from "./lint.js";
import { buildCorpusProfile, buildToneProfile, findPosts } from "./posts.js";
import { estimateCost, publishPost } from "./publish.js";
import { SCORING_RUBRIC, complianceScore, computeSignals } from "./scoring.js";
import { VOICE_PROFILE_TEMPLATE, resolveVoiceProfile } from "./voice.js";

function json(value: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function truncate(text: string, limit: number): { text: string; truncated: boolean } {
    if (text.length <= limit) {
        return { text, truncated: false };
    }
    return { text: `${text.slice(0, limit).replace(/\s+\S*$/, "")}...`, truncated: true };
}

export function createServer(): McpServer {
    const server = new McpServer({ name: "social-promoter", version: "0.1.0" });

    server.registerTool(
        "find_latest_post",
        {
            title: "Find latest post",
            description:
                "Find the newest published markdown post in a directory and return its full body plus prior posts as tone samples (full bodies by default). The agent reads the real prose to calibrate voice before drafting. Drafting itself is done by the agent, not this tool. Pair with get_voice_profile for the author's maintained voice rules.",
            inputSchema: {
                postsDir: z.string().optional().describe("Absolute path to the directory containing markdown posts. Defaults to SOCIAL_PROMOTER_POSTS_DIR when configured."),
                siteUrl: z.string().optional().describe("Public site base URL, used to build the article link. Defaults to SOCIAL_PROMOTER_SITE_URL when configured."),
                sampleSize: z.number().int().min(0).max(20).optional().describe("How many prior posts to return as tone samples (default 5)."),
                slug: z.string().optional().describe("Optional slug to target a specific post instead of the newest."),
                includeBodies: z.boolean().optional().describe("Return full post bodies for the target and tone samples so the model calibrates on real prose (default true)."),
                bodyCharLimit: z.number().int().min(200).max(20000).optional().describe("Max characters per sampled prior-post body (default 4000). The target post is returned in full."),
            },
        },
        async ({ postsDir, siteUrl, sampleSize, slug, includeBodies, bodyCharLimit }) => {
            const defaults = getServerDefaults();
            const resolvedPostsDir = postsDir ?? defaults.postsDir;
            const resolvedSiteUrl = siteUrl ?? defaults.siteUrl ?? "";
            if (!resolvedPostsDir) {
                return json({ error: "No postsDir provided and SOCIAL_PROMOTER_POSTS_DIR is not set. Pass a posts directory or configure one." });
            }
            const withBodies = includeBodies ?? true;
            const limit = bodyCharLimit ?? 4000;
            const posts = findPosts(resolvedPostsDir, { siteUrl: resolvedSiteUrl, includeBody: withBodies });
            if (!posts.length) {
                return json({ error: `No published posts found in ${resolvedPostsDir}.` });
            }

            const targetIndex = slug ? posts.findIndex((p) => p.slug === slug) : 0;
            if (targetIndex === -1) {
                return json({ error: `No post found with slug "${slug}".` });
            }

            const target = posts[targetIndex];
            const prior = posts.filter((_, i) => i !== targetIndex).slice(0, sampleSize ?? 5);
            return json({
                target,
                toneProfile: buildToneProfile(prior),
                toneSamples: prior.map((p) => {
                    const sample: { title: string; excerpt: string; date: string; body?: string; bodyTruncated?: boolean } = {
                        title: p.title,
                        excerpt: p.excerpt,
                        date: p.date,
                    };
                    if (withBodies && p.body) {
                        const { text, truncated } = truncate(p.body, limit);
                        sample.body = text;
                        sample.bodyTruncated = truncated;
                    }
                    return sample;
                }),
                voiceHint: "Call get_voice_profile for the author's maintained voice rules, then match the prose in these samples. Do not invent a new voice.",
            });
        },
    );

    server.registerTool(
        "get_voice_profile",
        {
            title: "Get voice profile",
            description:
                "Return the author's maintained voice profile so drafts sound like them, not like generic AI. Resolves a voice file in this order: explicit voiceFile, then a workspace file (.social-promoter/voice.md, voice-profile.md, VOICE.md, voice.md), then the global ~/.social-promoter/voice.md that travels across every repo. Optionally summarizes the whole post corpus. If no file exists, returns a ready-to-save starter template the agent can offer to write. Read this before drafting.",
            inputSchema: {
                voiceFile: z.string().optional().describe("Explicit path to a voice profile file (highest priority)."),
                workspaceDir: z.string().optional().describe("Directory to search for a workspace-local voice file (defaults to the current working directory)."),
                postsDir: z.string().optional().describe("If provided, also summarize the whole post corpus (count, date range, recurring themes)."),
                siteUrl: z.string().optional().describe("Public site base URL, used only for corpus link context."),
            },
        },
        async ({ voiceFile, workspaceDir, postsDir, siteUrl }) => {
            const defaults = getServerDefaults();
            const profile = resolveVoiceProfile({
                explicitPath: voiceFile ?? defaults.voiceFile,
                workspaceDir: workspaceDir ?? process.cwd(),
            });

            const result: Record<string, unknown> = { voiceProfile: profile };

            if (!profile.found) {
                result.guidance =
                    "No voice profile found. Offer to save one. Resolution order is explicit voiceFile, then a workspace file, then ~/.social-promoter/voice.md (global, travels everywhere). A populated profile plus full-post samples from find_latest_post is what makes drafts sound like the author.";
                result.starterTemplate = VOICE_PROFILE_TEMPLATE;
            }

            const resolvedPostsDir = postsDir ?? defaults.postsDir;
            if (resolvedPostsDir) {
                try {
                    result.corpus = buildCorpusProfile(resolvedPostsDir, { siteUrl: siteUrl ?? defaults.siteUrl ?? "" });
                } catch (error) {
                    result.corpusError = (error as { message?: string })?.message ?? "Could not read posts directory.";
                }
            }

            return json(result);
        },
    );

    server.registerTool(
        "lint_voice",
        {
            title: "Lint voice",
            description:
                "Check a draft post against the voice rules (no em-dash, no emoji, no banned AI-accent phrases, no 'not X, it's Y' clarifications, character limit). Returns structured violations. Run this on every draft before presenting it.",
            inputSchema: {
                text: z.string().describe("The draft post text to lint."),
                characterLimit: z.number().int().min(50).max(2000).optional().describe("Max characters (default 280)."),
                allowEmoji: z.boolean().optional(),
                allowEmDash: z.boolean().optional(),
                extraBannedPhrases: z.array(z.string()).optional().describe("Additional banned phrases to enforce."),
            },
        },
        async ({ text, characterLimit, allowEmoji, allowEmDash, extraBannedPhrases }) => {
            const overrides: Parameters<typeof lintVoice>[1] = {};
            if (characterLimit !== undefined) overrides.characterLimit = characterLimit;
            if (allowEmoji !== undefined) overrides.allowEmoji = allowEmoji;
            if (allowEmDash !== undefined) overrides.allowEmDash = allowEmDash;
            if (extraBannedPhrases?.length) {
                const { DEFAULT_RULES } = await import("./lint.js");
                overrides.bannedPhrases = [...DEFAULT_RULES.bannedPhrases, ...extraBannedPhrases];
            }
            return json(lintVoice(text, overrides));
        },
    );

    server.registerTool(
        "estimate_cost",
        {
            title: "Estimate posting cost",
            description:
                "Estimate the paid X API cost of publishing a post. Posts containing a URL fall in the higher cost tier. Drafting is always free; only publishing spends money.",
            inputSchema: {
                text: z.string().describe("The post text to price."),
                textOnlyUsd: z.number().min(0).optional(),
                withUrlUsd: z.number().min(0).optional(),
            },
        },
        async ({ text, textOnlyUsd, withUrlUsd }) => {
            const overrides: Parameters<typeof estimateCost>[1] = {};
            if (textOnlyUsd !== undefined) overrides.textOnlyUsd = textOnlyUsd;
            if (withUrlUsd !== undefined) overrides.withUrlUsd = withUrlUsd;
            return json(estimateCost(text, overrides));
        },
    );

    server.registerTool(
        "publish_post",
        {
            title: "Publish post",
            description:
                "Publish an approved post to X behind an explicit gate. Requires confirmed: true, which the agent may only set after the user approves the exact final text and acknowledges the cost tier. Set dryRun: true to validate without posting. Live posting needs a connected X account (run `npx social-promoter-mcp login`); if credentials are missing it falls back to a dry run. One approved post per call.",
            inputSchema: {
                text: z.string().describe("The exact, user-approved post text."),
                confirmed: z.boolean().describe("Must be true, and only after explicit user approval of this exact text."),
                dryRun: z.boolean().optional().describe("If true, validate and report cost without sending a request."),
                originalDraft: z.string().optional().describe("The original agent-generated draft, if the user edited the text before approving. Used to log the edit for voice-feedback analysis."),
                textOnlyUsd: z.number().min(0).optional(),
                withUrlUsd: z.number().min(0).optional(),
            },
        },
        async ({ text, confirmed, dryRun, originalDraft, textOnlyUsd, withUrlUsd }) => {
            const costOverrides: Partial<{ textOnlyUsd: number; withUrlUsd: number }> = {};
            if (textOnlyUsd !== undefined) costOverrides.textOnlyUsd = textOnlyUsd;
            if (withUrlUsd !== undefined) costOverrides.withUrlUsd = withUrlUsd;
            return json(await publishPost(text, { confirmed, dryRun, costOverrides, originalDraft }));
        },
    );

    server.registerTool(
        "record_decision",
        {
            title: "Record decision",
            description:
                "Record a post decision (edited or rejected) for voice-feedback analysis. Call this when the user edits a draft before posting, or explicitly rejects a draft. publish_post already logs 'posted' decisions automatically. Capturing edits and rejections builds the feedback loop that improves voice.md over time.",
            inputSchema: {
                draft: z.string().describe("The original agent-generated draft text."),
                action: z.enum(["edited", "rejected"]).describe("What the user did with the draft."),
                final: z.string().optional().describe("The final text the user sent (required when action is 'edited')."),
                note: z.string().optional().describe("Optional note about why this draft was rejected or what was changed."),
            },
        },
        async ({ draft, action, final, note }) => {
            if (action === "edited" && !final) {
                return json({ error: "final is required when action is 'edited'." });
            }
            logDecision({
                timestamp: new Date().toISOString(),
                action: action as DecisionAction,
                draft,
                final: final ?? draft,
                edited: action === "edited",
                note,
            });
            return json({ recorded: true, action, note: "Decision logged to ~/.social-promoter/decisions.jsonl." });
        },
    );

    server.registerTool(
        "distill_voice_feedback",
        {
            title: "Distill voice feedback",
            description:
                "Read the decision log and surface patterns in how the author edits or rejects drafts. Returns concrete suggested additions to voice.md based on observed behavior — opening rewrites, heavy edits, rejection patterns. Run this periodically (after 5+ posts) to improve voice calibration over time. This is the optimization loop's feedback step.",
            inputSchema: {},
        },
        async () => {
            const entries = readDecisions();
            return json(distillVoiceFeedback(entries));
        },
    );

    server.registerTool(
        "score_draft",
        {
            title: "Score draft",
            description:
                "Compute deterministic signals for a draft post and return a structured scoring rubric so the model can evaluate five quality dimensions consistently: voice_match, standalone, specificity, conversation_pull, and compliance. The compliance score is derived deterministically from lint violations; the other four require model judgment using the rubric criteria and the author's voice profile. Returns signals + rubric + the deterministic compliance score. Use this to rank multiple draft variants before presenting them.",
            inputSchema: {
                text: z.string().describe("The draft post text to score."),
                violationCount: z.number().int().min(0).describe("Number of lint violations from lint_voice (required to compute compliance score)."),
                violations: z
                    .array(z.object({ severity: z.string() }))
                    .optional()
                    .describe("Full violations array from lint_voice for accurate compliance scoring."),
            },
        },
        async ({ text, violationCount, violations }) => {
            const signals = computeSignals(text, violationCount);
            const compliance = complianceScore(violations ?? Array.from({ length: violationCount }, () => ({ severity: "error" })));
            return json({
                signals,
                complianceScore: compliance,
                rubric: SCORING_RUBRIC,
                instructions:
                    "Use the signals as factual grounding and the rubric criteria to score voice_match, standalone, specificity, and conversation_pull (1–10 each). The complianceScore above is deterministic — use it directly. Present all five scores alongside the draft.",
            });
        },
    );

    server.registerTool(
        "reflect_on_draft",
        {
            title: "Reflect on draft",
            description:
                "Return a targeted diagnostic for a low-scoring draft dimension — the reflector step from the agent optimization loop. Provide the draft, the dimension that scored poorly, and optionally the voice profile content. Returns the dimension's full criteria and anti-patterns, which signals suggest the specific problem, and a structured prompt for the model to diagnose and suggest a concrete rewrite direction. Better diagnosis beats better generation.",
            inputSchema: {
                draft: z.string().describe("The draft post text that scored poorly."),
                dimension: z
                    .enum(["voice_match", "standalone", "specificity", "conversation_pull", "compliance"])
                    .describe("The scoring dimension that needs improvement."),
                signals: z
                    .object({
                        opensWithSoftGeneralization: z.boolean().optional(),
                        hasContextDependency: z.boolean().optional(),
                        endsWithQuestion: z.boolean().optional(),
                        opensWithQuestion: z.boolean().optional(),
                        violationCount: z.number().optional(),
                    })
                    .optional()
                    .describe("Signals from score_draft to ground the diagnosis."),
                voiceProfileContent: z.string().optional().describe("The author's voice profile content from get_voice_profile, for voice_match diagnosis."),
            },
        },
        async ({ draft, dimension, signals, voiceProfileContent }) => {
            const dim = SCORING_RUBRIC.dimensions[dimension];
            if (!dim) {
                return json({ error: `Unknown dimension: ${dimension}` });
            }

            // Build signal-based observations for this dimension.
            const observations: string[] = [];
            if (dimension === "voice_match" && signals?.opensWithSoftGeneralization) {
                observations.push("Signal: post opens with a soft generalization (a pattern the author's corpus does not use).");
            }
            if (dimension === "standalone" && signals?.hasContextDependency) {
                observations.push("Signal: post contains context-dependency language ('as I mentioned', 'in the post', etc.) — it leans on external context.");
            }
            if (dimension === "conversation_pull" && !signals?.endsWithQuestion) {
                observations.push("Signal: post does not end with a question — consider whether this variant should invite a reply.");
            }
            if (dimension === "compliance" && (signals?.violationCount ?? 0) > 0) {
                observations.push(`Signal: ${signals?.violationCount} lint violation(s) — run lint_voice for the specific rules broken.`);
            }
            if (dimension === "specificity" && signals?.opensWithSoftGeneralization) {
                observations.push("Signal: soft generalization opener suggests the claim may not be grounded in a specific artifact or decision.");
            }

            return json({
                dimension: dim.name,
                description: dim.description,
                criteria: dim.criteria,
                antiPatterns: dim.antiPatterns,
                scoringNote: dim.scoringNote,
                signalObservations: observations,
                voiceContext: voiceProfileContent
                    ? `Voice profile provided (${voiceProfileContent.length} chars). Use it to identify the specific mismatch.`
                    : "No voice profile provided. Call get_voice_profile first for a stronger diagnosis.",
                reflectionPrompt:
                    `Diagnose why this draft scores low on '${dim.name}'. Cite a specific phrase or structural choice that triggers an anti-pattern. Then propose one targeted edit direction (not a full rewrite) that addresses the root cause. Be specific: name what to change and why it matters for this author's voice.`,
            });
        },
    );

    return server;
}

export async function startServer(): Promise<void> {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
