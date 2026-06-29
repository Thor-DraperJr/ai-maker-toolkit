# AI Maker Toolkit Instructions

This repo is a public toolkit of copyable VS Code-first AI skills, agents, workflows, and MCP servers. Keep it small, practical, and grounded in work that has been used or can be clearly explained.

## Package Ownership

Use these ownership layers when editing:

- Root README: orient the reader and point to lanes.
- Lane READMEs: list current inventory and package shape.
- Package READMEs: explain what to copy, proof or examples, and why the package helps.
- Skills: define agent behavior and task-specific workflow instructions.
- Agents: provide specialist review or context isolation.
- Workflows: combine skills, agents, tools, proof, and human gates.
- MCP servers: provide deterministic tools, tests, manifests, and package docs.
- `.github`: live repo-local Copilot files only, such as instructions, agents, and prompts.

If a detail belongs in a lower layer, move or remove it from the higher layer. Do not duplicate the same explanation across root, lane, and package READMEs.

## Repo Shape

- Skills live under `skills/<category>/<skill-name>/`.
- Agents are packaged under `agents/<category>/<agent-name>/`; live agent files live under `.github/agents/`.
- Workflows live under `workflows/<category>/<workflow-name>/`.
- MCP servers live under `mcp-servers/<server-name>/`.
- Repo-local prompt entry points live under `.github/prompts/`.
- Do not put README documentation inside `.github`; explain public packages in normal repo folders.
- Do not use `.github/workflows/` for AI playbooks. Reserve it for actual GitHub Actions workflows.

## Editing Style

- Prefer pruning, moving, or merging over restating.
- Keep changes narrowly scoped to the package or lane being edited.
- Do not add frameworks, generators, demos, screenshots, or docs unless they clearly serve a package.
- Keep copy direct and practical. Avoid generic AI phrasing, corporate polish, and inflated claims.
- For README edits, settle structure first, then use the Voice & Publish Editor for late-stage voice, copy, and publish-readiness review.
- Use ASCII unless the existing file already needs non-ASCII.

## Security And Generated Files

- Never commit `.env`, credentials, tokens, private keys, dependency folders, build output, generated bundles, or local test artifacts.
- `.env.example` files are allowed only when placeholder-only and useful for deployment or local setup.
- Do not ask the user to paste secrets into chat. For secrets, tell the user to enter them directly in the terminal or secure client configuration.
- MCP server packages should keep source, tests, manifests, templates, package metadata, and safe examples only.

## Validation

After edits, run the cheapest relevant check:

- Markdown diagnostics for changed docs.
- Local Markdown link validation after moving, renaming, or deleting docs/assets.
- Secret scan after importing MCP servers, env docs, credential docs, or external packages.
- Package build/tests when changing code, manifests, scripts, or package metadata.
- File tree review after pruning generated or duplicated folders.

Do not fix unrelated bugs or broaden the repo while validating a narrow change.