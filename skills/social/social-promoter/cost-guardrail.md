# Cost Guardrail & Approval Gate

Drafting is local and free. Publishing is the only step that spends money. Make the cost visible at the moment of decision, every time.

## Cost Tiers (defaults, configurable)

- Text-only post: ~`$0.015` per write.
- Post containing a URL: ~`$0.200` per write.
- Final billing is controlled by the user's X developer account and plan.

The X API is pay-per-usage with per-endpoint pricing. The two tiers above cover the
posting path this skill uses (`Content: Create`). Other actions (reads, deletes, list
management) have their own per-request prices. If you ever propose an action beyond
posting, tell the user it is a separate paid call before doing it.

A draft that includes a link is in the higher tier. State which tier applies before any publish.

## Approval-Gate Contract

1. The agent presents drafts and stops. No posting.
2. The user picks a draft and may ask for edits.
3. Before any publish, the agent restates the exact final text and the cost tier, and asks for explicit confirmation.
4. Only after the user approves that exact text, the agent may publish on the user's behalf:
   - Preferred: the `social-promoter` MCP `publish_post` tool with `confirmed: true` (one approved post per call). It posts live to the connected X account; with no account connected or `dryRun: true` it falls back to a dry run and sends nothing.
   - Connecting an account is a one-time `npx social-promoter-mcp login` (see `onboarding.md`).
   - If the MCP server is not available, the agent hands back the exact text and the user posts manually.
5. The agent reports the result (posted URL, dry-run notice, or the exact failure) back to the user.

Approval must name the specific draft and confirm the final wording. "Looks good" on a set of four drafts is not approval to post all four. Publish one approved post at a time.

## Cost-Sensitive Defaults

- Default to a draft-first workflow. Never assume the user wants to post.
- Do not batch multiple paid posts in one approval. One post, one confirmation.
- If credits/billing are unconfigured, stop at drafts and say so. Do not attempt a paid call.
