---
name: social-promoter
description: Draft tone-aware social posts (X/LinkedIn) from a blog post or from lessons learned in a coding session, then enforce posting rules, a cost guardrail, and an explicit human-approval gate before anything is published. Use when the user wants to promote a blog post, turn a coding session into social content, build a posting cadence, or grow their personal brand. Drafting is free and always allowed; publishing is a paid action that requires explicit confirmation. This skill never posts on its own.
---

# Social Promoter

Turn a finished blog post, or the lessons from a coding session, into tone-matched social drafts the author would actually post. Drafting is local and free. Publishing is a paid, human-approved action that this skill never performs automatically.

This is the agent-portable behavior layer for the Social Promoter workflow. The capability lives in the `social-promoter` MCP server (`find_latest_post`, `get_voice_profile`, `lint_voice`, `estimate_cost`, `publish_post`, `score_draft`, `reflect_on_draft`, `record_decision`, `distill_voice_feedback`). Prefer those tools for the deterministic steps. If the server is not available, perform the same steps manually as described below. The creative drafting is always done by you, the agent, not by a tool.

## Install

This skill ships in this repo under `skills/social/social-promoter/`. Copy it to `.github/skills/social-promoter/` in a VS Code repo, or to your client's skills directory, so the behavior travels with the workspace that needs it.

The capability (the MCP server) installs one of three ways:

- **MCP Bundle (.mcpb)** — the easiest path for clients that support bundles (e.g. Claude Desktop): build `social-promoter-mcp.mcpb` with `npm run bundle`, then drag it in and fill the optional config fields. See [mcp-servers/social-promoter](../../../mcp-servers/social-promoter/).
- **npx** — add the server to your MCP config with `npx -y social-promoter-mcp@0.1` (pin the version).
- **global install** — `npm i -g social-promoter-mcp`, then reference `social-promoter-mcp`.

## When To Use

- "Promote my latest post" / "draft some X posts for this article."
- "Turn this coding session into a social post / lesson learned."
- "Help me build a posting cadence" / "work on my brand."

First-time publishing needs a connected X account. If the user wants to publish and
no account is connected (`npx social-promoter-mcp status` reports not connected, or
`publish_post` returns a dry run), walk them through `onboarding.md` first. Drafting
never requires this.

## Two Input Modes

1. **Blog post mode** — Source is a finished article. It may be (a) the newest non-draft post in the author's posts directory, (b) a specific post the user names or opens, (c) a blog they paste into the chat, or (d) a public URL they give you (fetch and read it). Sample 4-6 prior posts to calibrate tone.
2. **Session-lessons mode** — Source is the current coding session. Extract 1-3 concrete, non-confidential lessons (what was built, what broke, what the takeaway was) and treat those as the source idea.

If the user does not say which mode, infer from context: an open/named post file, a pasted article, or a link → blog post mode; "this session" / "what we just did" → session-lessons mode.

## Example Requests

These are illustrative, not the only shapes a request takes. A user may or may not want a link, may name a specific post, may paste content, or may ask for images. Adapt; do not force a request into one of these molds.

- **"Summarize what we learned/did this session and post it on X."** → Session-lessons mode. Load the voice profile, distill the session into one idea + one concrete takeaway, draft the variants in the author's voice, lint, show the cost, and stop at the approval gate. Publish only the one draft the user approves.
- **"Read this blog and create an engaging X post without the URL on this topic."** → Blog post mode. Read the full article (file, pasted text, or fetched link), sample prior posts for tone, draft variants that stand on their own, and attach NO link. No link means the text-only cost tier (~$0.015), not the with-URL tier. Lint, show cost, stop at the approval gate.

Whether to include a link is the user's call per post. If they want it, attach it; if they say "without the URL," do not, and quote the lower text-only cost. Image attachments are not supported by `publish_post` yet (text plus an optional link only); if a user asks for an image, draft the copy, say images aren't published by the tool yet, and hand the image plan back to them.

## Workflow

1. **Load the voice profile first.** Call `get_voice_profile` (pass `postsDir` to also get a corpus summary). If it returns `found: false`, offer to save the starter template it returns to a workspace file (`.social-promoter/voice.md`) or the global `~/.social-promoter/voice.md`, and ask the user to fill it in. A populated voice profile is what makes drafts sound like the author. See `voice-profile.md`.
2. **Locate the source and sample real prose.**
   - Blog post mode: if the source is in the posts directory, `find_latest_post` returns the target post's full body and prior posts as full-text samples. If the user pastes an article or gives a URL, read that as the source and still call `find_latest_post`/`get_voice_profile` for prior-post tone samples. Read the actual prose, not just titles. Skip files with `draft: true`.
   - Session-lessons mode: summarize the session into a one-line idea + one concrete takeaway.
3. **Match the voice.** Calibrate against the voice profile and the full-text samples. Do not invent a new voice.
4. **Draft four variants.** Each ≤ the character limit (default 280):
   - **Launch** — direct "new post / new thing" announcement.
   - **Insight** — the single most useful takeaway.
   - **Conversation** — a genuine question to peers/leaders that invites replies.
   - **Follow-up** — a later-in-the-week reflection that extends the idea.
5. **Score and rank the variants.** For each draft: run `lint_voice` → run `score_draft` (pass in the violation count) → use the rubric to evaluate voice_match, standalone, specificity, and conversation_pull (1–10 each; compliance is returned deterministically). If any draft scores below 6 on any dimension, call `reflect_on_draft` for that dimension to get a targeted rewrite diagnosis before revising.
6. **Apply the posting rules** (see `posting-rules.md`). Rewrite any draft that trips an error-level rule; never present a draft you know violates the rules.
7. **Attach the link** only if the source has a public URL and the user wants it. URLs change the cost tier. If the user says "without the URL," do not attach one.
8. **Show the cost guardrail** (`estimate_cost`). State the estimated paid cost per post and that publishing is the only step that spends money.
9. **Stop at the approval gate.** Present ranked drafts and wait. Do not post. If the user approves a specific draft, confirm the exact final text and the cost tier before any publish action.
10. **Publish only on explicit approval.** Once the user approves exact text and the cost tier, call `publish_post` with `confirmed: true`. Pass `originalDraft` if the user edited the text so the change is logged for future voice refinement. If the user rejects all drafts, call `record_decision` with `action: "rejected"` for each.
11. **Periodically distill feedback.** After several posts, call `distill_voice_feedback` and show the author the patterns it found. Suggest updating `voice.md` with the recommended additions — this closes the optimization loop.

## Output Format

Present results like this:

```
Source: <title or session summary>
Voice: <file found at <path> | starter template offered>
Tone read: <2-4 traits>, frequent terms: <terms>
Link: <url or "none">

Launch (NN/280):
<text>

Insight (NN/280):
<text>

Conversation (NN/280):
<text>

Follow-up (NN/280):
<text>

Cost note: publishing is paid (~$0.015 text-only, ~$0.200 with a link). Drafting is free.
Next: pick one to refine, or approve exact text to publish yourself.
```

Always show the character count per draft. Always end at the approval gate.

## Hard Rules

- Never publish without explicit, specific approval of the exact final text and an acknowledged cost tier.
- Never auto-confirm a paid action or skip the cost line. One post, one approval.
- Never include customer names, internal roadmap dates, unreleased SKUs, or anything confidential.
- Drafting is always free and allowed; only the publish step costs money.
- If a draft cannot satisfy the posting rules, say so rather than shipping a weak draft.

## Reference Files

- `voice-profile.md` — how to load, create, and maintain the author's voice profile.
- `onboarding.md` — first-time setup: walk the user through connecting their X account.
- `posting-rules.md` — the voice/quality lint applied before presenting drafts.
- `cost-guardrail.md` — cost tiers and the approval-gate contract.
