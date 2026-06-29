---
name: repo-pruner
version: 0.1.0
description: "Use when pruning unnecessary, duplicative, stale, over-broad, or misplaced repo content; especially README, skill, agent, workflow, MCP server, package, proof, and generated-file cleanup."
---

# Repo Pruner

Use this skill to reduce repo surface area while preserving the pieces that help a reader or agent act. Your job is to challenge whether each section, file, package, screenshot, or claim still earns its place.

This is an editing skill. If the user asks you to prune, clean up, simplify, challenge files, remove duplication, or tighten repo packaging, you should edit directly when the better structure is clear.

## Core Principle

Every piece of content needs a job and a home.

- The root README orients.
- Lane READMEs list the current inventory and package shape.
- Package READMEs explain what the package is, the use case, examples or proof, copy path, and why it helps.
- Skills define agent behavior.
- Agents provide specialist review or context isolation.
- Workflows combine skills, agents, tools, proof, and human gates.
- MCP servers provide deterministic tools and should not carry local secrets, dependencies, generated output, or unrelated experiments.

If a detail belongs in a lower layer, move or remove it from the higher layer. If the same idea appears twice, keep the version closest to the package that owns it.

## What To Look For

Challenge these first:

1. Root README content that duplicates package README details.
2. Full asset inventories in places that should only point to a lane README.
3. Screenshots or hero images that do not prove the section they are in.
4. Stale file paths after moves or package renames.
5. Unverified adapter, stack, install, or support claims.
6. Generated files, local test artifacts, build output, dependency folders, and local-only scripts.
7. Credential files, `.env` files, private keys, local tokens, or docs that encourage entering secrets into chat.
8. Repeated setup instructions that should live in one package README.
9. Candidate ideas that should be moved to a workflow backlog or deleted until real.
10. Tables that repeat the same map in slightly different words.

## Editing Loop

1. Identify the narrow slice to prune.
2. State the owner layer: root, lane, package, skill, agent, workflow, MCP server, proof asset, or generated artifact.
3. Decide one action: keep, rewrite, move, merge, or delete.
4. Edit the smallest useful set of files.
5. Validate immediately before continuing.
6. Repeat until the repo map and package boundaries are clear.

Do not turn the cleanup into a broad rewrite. Prefer removing duplication over rephrasing it.

## Validation

Run the cheapest validation that can catch the change you made:

- Markdown diagnostics for edited docs.
- Local Markdown link validation after moving or deleting docs/assets.
- Secret scan after importing code, MCP servers, credentials docs, or external packages.
- Package build/tests if pruning code, package scripts, manifests, or MCP server files.
- File tree review after deleting generated or duplicated folders.

If validation fails because the edit removed something real, restore the needed content in the correct layer rather than reintroducing broad duplication.

## Pair With Voice & Publish Editor

Run this skill before the Voice & Publish Editor.

Once structure is stable, ask the Voice & Publish Editor to review the changed Markdown. The voice pass should not reopen structure unless the writing still creates confusion, overclaiming, or publish risk.

## Output After Editing

Return:

- Files changed.
- What was pruned or moved.
- What was intentionally kept and why.
- Validation run and results.
- Whether the Voice & Publish Editor pass was run, and any remaining publish-readiness notes.