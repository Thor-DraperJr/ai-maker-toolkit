# Social Promoter Skill

A copyable skill for turning a finished article, or the lessons from a coding session, into social posts that still sound like the author.

Use it when you want an agent to draft LinkedIn or X posts, preserve voice, show cost before paid publishing, and stop at a human approval gate.

## What It Does

| Job | Outcome |
|---|---|
| Read the source | Uses a blog post, pasted article, public URL, or current coding session as the source idea. |
| Match the voice | Loads a voice profile and samples real prose before drafting. |
| Draft variants | Produces launch, insight, conversation, and follow-up options. |
| Lint and score | Checks drafts against voice rules, posting rules, and quality dimensions. |
| Guard cost | Shows estimated paid X API cost before any publish action. |
| Stop for approval | Never posts unless the user approves the exact final text and cost tier. |

## Use Case I Have Seen

After publishing a blog post or finishing a meaningful coding session, the useful lesson can disappear unless I turn it into a short public reflection. This skill gives the agent a structured way to draft posts from real work without turning them into generic promotional copy.

The strongest use cases are:

- Promoting a finished blog post without sounding like marketing copy.
- Turning a coding session into one clear lesson learned.
- Building a posting cadence around career growth, learning, and maker projects.
- Preserving a personal voice while still using AI to draft faster.

## Examples

This skill came from the Social Promoter MCP workflow in [mcp-servers/social-promoter/](../../../mcp-servers/social-promoter/).

The workflow is designed to work with:

- A maintained voice profile.
- Full-text writing samples from a blog or pasted source.
- The `social-promoter` MCP server when available.
- Manual fallback steps when the MCP server is not available.

## Copy Path

This package lives here:

```text
skills/social/social-promoter/
```

To use it in a VS Code repo, copy the skill files into:

```text
.github/skills/social-promoter/SKILL.md
.github/skills/social-promoter/cost-guardrail.md
.github/skills/social-promoter/onboarding.md
.github/skills/social-promoter/posting-rules.md
.github/skills/social-promoter/voice-profile.md
```

If your agent system uses a different skill location, keep the same folder contents and adapt the path.

## First Prompt

```text
Use the social promoter skill.
Turn this article into four social post drafts.
Keep my voice, show character counts, lint against the posting rules, estimate cost, and stop before publishing.
```

## MCP Server

The skill works best with the Social Promoter MCP server, which provides deterministic tools for finding posts, loading voice profiles, linting drafts, estimating cost, recording decisions, and publishing only after explicit approval.

See [mcp-servers/social-promoter/](../../../mcp-servers/social-promoter/) for the server package.

## Why It Is Useful

AI can draft quickly, but social posts are easy to make too generic, too polished, or too expensive by accident. This skill makes the agent slow down at the right moments: use real source material, match voice, check rules, show cost, and wait for the human decision.
