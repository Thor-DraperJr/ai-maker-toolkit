# Repo Prune And Publish Review

A workflow for cleaning up AI Maker Toolkit packages without losing Thor's voice or useful proof.

Use it when a README, skill, agent, workflow, MCP server package, or folder starts to feel duplicated, too large, stale, or unclear.

## Trigger

Run this workflow when the user says things like:

- "Prune anything unnecessary."
- "Challenge all of the files."
- "This README feels duplicative."
- "Make sure the repo is only providing value."
- "Clean this up and then run the voice editor."

## Tools Involved

| Tool | Job |
|---|---|
| [Repo Pruner Skill](../../../skills/maintenance/repo-pruner/) | Find and edit unnecessary, duplicative, stale, or misplaced content. |
| [Voice & Publish Editor](../../../.github/agents/) | Review the changed Markdown for voice, mechanics, consistency, and publish readiness after structure is stable. |

## Workflow

1. Pick the target slice: root README, a lane README, one package, one MCP server, one workflow, or one imported folder.
2. Use the Repo Pruner Skill to assign ownership for each detail: root, lane, package, skill, agent, workflow, MCP server, proof, or generated artifact.
3. Edit directly where the better home is clear. Remove duplication instead of restating it.
4. Keep proof close to the package it proves. Remove visuals that do not serve the surrounding content.
5. Validate the structural edit with diagnostics, Markdown link checks, secret scan, file tree review, or package tests as appropriate.
6. Run the Voice & Publish Editor on changed Markdown in edit mode if the user asked for editing, or review-only mode if the user asked for notes.
7. Apply only voice/copy edits that preserve the structure created by the pruning pass.
8. Run final validation.

## Human Gate

Ask before deleting a package, removing a public proof asset, changing an MCP server API, publishing, posting, pushing, or spending money.

Small README cleanup and obvious generated-file removal can be edited directly when the user asked for cleanup.

## Done Looks Like

- The root README orients instead of inventorying everything.
- Lane READMEs carry inventory.
- Package READMEs carry copy paths, proof, examples, and why the package helps.
- Generated files and local-only artifacts are gone.
- Secret-bearing files are absent or ignored.
- Markdown links and relevant package checks pass.
- Voice & Publish Editor has reviewed the changed Markdown after structure settled.