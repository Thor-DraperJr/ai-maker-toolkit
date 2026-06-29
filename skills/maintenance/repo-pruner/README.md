# Repo Pruner Skill

A copyable skill for asking whether repo content still earns its place, then removing duplication, stale claims, misplaced package details, and extra files or sections.

Use it when a repo starts to feel too large, too repetitive, too framework-like, or too hard to explain from the README.

## What It Does

| Job | Outcome |
|---|---|
| Map ownership | Separates root README, lane README, package README, skill, agent, MCP server, workflow, and proof assets. |
| Find duplication | Flags repeated install steps, repeated proof, stale paths, overlapping tables, and package details living at the wrong layer. |
| Challenge value | Asks what each file or section helps a reader or agent do. |
| Edit directly | Removes, moves, or rewrites content when the better home is clear. |
| Preserve proof | Keeps screenshots, examples, and public links when they prove a package works. |
| Validate | Runs Markdown links, diagnostics, secret checks when relevant, and focused package tests when code changes. |

## Use Case I Have Seen

This came from shaping AI Maker Toolkit itself. The repo kept drifting toward duplicate README sections, old starter-kit language, package-specific copy instructions in the root README, and proof images in places where they did not help the reader.

The useful pattern was not a one-time cleanup. It was a repeatable editorial pass:

1. Decide what layer owns the detail.
2. Remove anything that duplicates another layer.
3. Keep proof close to the package it proves.
4. Validate after pruning.
5. Run the Voice & Publish Editor after the structure is stable.

## Examples

Good targets for this skill:

- A root README that has become a full asset inventory.
- A package README that repeats the root positioning instead of explaining the package.
- A skill folder that contains unused prompts, screenshots, generated output, or stale copy paths.
- An MCP server package that accidentally includes local credentials, build output, or duplicate skill copies.
- A workflow page that lists ideas but does not say when to use the workflow or where the human gate lives.

## Copy Path

This package lives here:

```text
skills/maintenance/repo-pruner/
```

To use it in a VS Code repo, copy the skill into:

```text
.github/skills/repo-pruner/SKILL.md
```

If your agent system uses a different skill location, keep the same folder contents and adapt the path.

## First Prompt

```text
Use the repo pruner skill.
Review this repo for unnecessary, duplicative, stale, or misplaced content.
Edit directly where the better structure is clear, then validate links and run the Voice & Publish Editor on the changed Markdown.
```

## Relationship To Voice Review

This skill handles structure and surface area first. The Voice & Publish Editor handles voice, mechanics, and publish readiness after the pruning pass has stopped moving sections around.

## Why It Is Useful

AI-assisted repos pick up clutter fast: extra docs, old claims, copied setup steps, generated artifacts, and proof in the wrong place. This skill gives the agent permission to challenge that sprawl, make small edits, and prove the repo is easier to understand afterward.