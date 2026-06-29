# Skills

Skills are copyable capabilities an AI agent can use inside a VS Code repo. This folder is organized for humans first, so each package lives under a category and skill name.

## Current Skills

| Skill | Helps With | Package |
|---|---|---|
| Article Visuals | Turning written articles into visual explanations and optional browser present mode. | [content/article-visuals](content/article-visuals/) |
| Repo Pruner | Pruning unnecessary, duplicative, stale, or misplaced repo content while preserving useful proof. | [maintenance/repo-pruner](maintenance/repo-pruner/) |
| Social Promoter | Drafting social posts from articles or coding sessions with voice matching, cost guardrails, and human approval. | [social/social-promoter](social/social-promoter/) |

## Package Shape

```text
skills/<category>/<skillname>/
  README.md
  SKILL.md
  prompts/
  images/
```

Use `prompts/` only when the skill has reusable prompt assets. Use `images/` for screenshots called out in the README.

Each skill README should cover:

| Section | Purpose |
|---|---|
| What it is | The plain-language promise. |
| Use case I have seen | Where this helped in real work. |
| Examples | Blog posts, screenshots, demos, or other proof. |
| Copy path | Where the package lives here and where to install it in a VS Code repo. |

## Future Candidates

These are workflows I already use enough that they may deserve their own packaged skill later:

| Candidate | Likely Shape |
|---|---|
| Content Deliverable Loop | A closed build, screenshot, review, and fix loop for article visuals and talk-ready content. |
