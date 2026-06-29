---
description: "Use when pruning this repo's README, skills, agents, workflows, MCP servers, or package docs, then running voice and publish review after structure is stable."
---

# Repo Prune And Publish Review

Run the packaged workflow in [workflows/maintenance/repo-prune-and-publish-review/](../../workflows/maintenance/repo-prune-and-publish-review/).

Use the [Repo Pruner Skill](../../skills/maintenance/repo-pruner/) first to decide what should stay, move, merge, or be deleted. Then use the [Voice & Publish Editor](../agents/voice-publish-editor.agent.md) after the structure is stable.

Keep these rules:

- Root README orients; it does not carry full package instructions.
- Lane READMEs list inventory and package shape.
- Package READMEs carry copy paths, proof, examples, and why the package helps.
- Generated files, local-only artifacts, credentials, and duplicate packaged content should not stay in the repo.
- Ask before deleting a package, removing proof assets, changing an MCP API, publishing, posting, pushing, or spending money.

Validate with Markdown diagnostics, local link checks, secret scanning, and package-specific tests when the touched slice has them.