# MCP Servers

MCP servers are tool backends that give an AI agent deterministic capabilities. In this repo, they sit beside the skills that explain when and how to use them.

## Current Servers

| Server | Helps With | Package |
|---|---|---|
| Social Promoter | Finding source posts, loading voice profiles, linting drafts, estimating cost, recording decisions, and publishing only after approval. | [social-promoter](social-promoter/) |

## Package Shape

```text
mcp-servers/<server-name>/
  README.md
  package.json
  manifest.json
  src/
  scripts/
  templates/
  test/
```

Do not include local `.env` files, credentials, `node_modules/`, `dist/`, or generated bundles. Those should be rebuilt or configured by the person adopting the server.

## Relationship To Skills

The MCP server owns deterministic tools. The skill owns the agent behavior: when to call tools, what to draft, what to lint, where the cost gate lives, and when to stop for human approval.
