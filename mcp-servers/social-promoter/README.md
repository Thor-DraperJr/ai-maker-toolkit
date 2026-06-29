# Social Promoter MCP

A portable [Model Context Protocol](https://modelcontextprotocol.io) server that gives any Copilot or agent session the **deterministic half** of a social-promotion workflow. The agent (the model) does the creative drafting; this server does the parts a model should not be trusted to do by itself:

- **`find_latest_post`** — find the newest published markdown post in a directory and return its full body plus prior posts as full-text tone samples, so the agent calibrates on real prose, not 200-character excerpts.
- **`get_voice_profile`** — return the author's maintained voice profile (how they actually write) and, optionally, a summary of the whole post corpus. Resolves a voice file by explicit path, then a workspace file, then a global `~/.social-promoter/voice.md`. Returns a ready-to-save starter template when none exists.
- **`lint_voice`** — check a draft against voice rules (no em-dash, no emoji, no banned AI-accent phrases, no "not X, it's Y" clarifications, character limit). Returns structured violations.
- **`estimate_cost`** — price a post; posts with a URL fall in the higher cost tier.
- **`publish_post`** — publish an approved post to X behind an explicit confirmation gate. Requires `confirmed: true`; falls back to a dry run when `dryRun` is set or credentials are absent, so it never spends money by accident.

`find_latest_post` and `get_voice_profile` supply the raw material; the agent does the
creative drafting; `lint_voice` enforces the rules deterministically. Voice matching is
a model job, so the server retrieves great source material rather than approximating a
voice with keyword math.

The MCP server is the portable core. This package intentionally brings over the server source, manifest, templates, scripts, and tests without local credentials, dependencies, build output, or the optional VS Code extension experiment.

## Why an MCP server instead of a repo script

A posting script that lives in one blog repo only works in that repo. An MCP server is configured once and is then available in **every** workspace and session, and anyone can adopt it with a single config snippet. That makes the capability portable for you and teachable to others.

The creative writing stays with the agent on purpose. This server only owns discovery, linting, cost, and the publish gate.

## Behavior ships as a skill

The deterministic capability is the MCP server. The *behavior* (how to sequence the
tools, the posting rules, the cost gate, voice-profile setup) ships as a skill in
[`../../skills/social/social-promoter/`](../../skills/social/social-promoter/). Copy that folder to `.github/skills/social-promoter/` in a VS Code repo, or to your client's skills directory, so the workflow travels with the workspace that needs it.
The skill prefers the MCP tools when present and falls back to manual steps when not.

## Quick start (easy button)

No clone or build required. Point any MCP client at the published package and let
`npx` fetch it.

In VS Code, add this to `.vscode/mcp.json` (per workspace) or your user-level MCP
config (every workspace):

```json
{
  "servers": {
    "social-promoter": {
      "command": "npx",
      "args": ["-y", "social-promoter-mcp@0.1"]
    }
  }
}
```

Pin a version (here `@0.1`) so a future release never changes behavior under you;
bump it when you choose to. The tools then appear to the agent automatically. Drafting
works immediately and costs nothing.

## Install as an MCP Bundle (.mcpb)

For clients that support [MCP Bundles](https://github.com/anthropics/mcpb) (a single
signed archive with the server and its dependencies inside), this repo can build a
one-drag installer:

```bash
npm run bundle        # writes build/social-promoter-mcp.mcpb
npm run bundle -- --sign   # optional: also create a self-signed signature
```

Then open the `.mcpb` in your client (e.g. drag it into Claude Desktop's extensions
settings) and fill in the optional config fields. The bundle exposes:

- **X keys** (API key/secret, access token/secret) — optional. Enter them only in the
  client's secure config fields if you want to publish without running `login`.
- **Posts directory**, **site URL**, and **voice profile file** — optional defaults so
  the agent does not have to pass them on every call (see below).

The bundle stages only the runtime files and production dependencies, so it stays lean.

## Point the server at your blog (optional defaults)

So the agent does not have to pass `postsDir`/`siteUrl`/`voiceFile` on every call, the
server reads three optional environment defaults. A tool argument always overrides the
matching default.

| Env var | Used by | Meaning |
| --- | --- | --- |
| `SOCIAL_PROMOTER_POSTS_DIR` | `find_latest_post`, `get_voice_profile` | Folder of your published markdown posts. |
| `SOCIAL_PROMOTER_SITE_URL` | `find_latest_post`, `get_voice_profile` | Base URL of your blog, used to build article links. |
| `SOCIAL_PROMOTER_VOICE_FILE` | `get_voice_profile` | Explicit path to your `voice.md`. |

Set them in your MCP config's `env` block, or fill the matching fields when installing
the `.mcpb` bundle. Empty values and unsubstituted `${...}` placeholders are treated as
unset, so leaving a bundle field blank is safe.

This package includes [`.env.example`](.env.example) as a reference for local
development, CI, or deployment hosts that inject environment variables into the MCP
server process. The server does not load `.env` files automatically; copy those values
into your MCP config, shell, or deployment environment when you need them. Do not commit
real credentials.

In an MCP config:

```json
{
  "servers": {
    "social-promoter": {
      "command": "npx",
      "args": ["-y", "social-promoter-mcp@0.1"],
      "env": {
        "SOCIAL_PROMOTER_POSTS_DIR": "/path/to/your/posts",
        "SOCIAL_PROMOTER_SITE_URL": "https://you.example.com"
      }
    }
  }
}
```

## Connect your X account (only needed to publish)

Drafting is free and needs no setup. Publishing posts to your own X account does need
setup, so connect it once before the first live publish:

```bash
npx social-promoter-mcp login
```

The command prompts for four values from a personal X developer app (API key/secret
and access token/secret). Input is hidden, verified with X, and stored locally in a
permission-locked file at `~/.social-promoter/credentials.json`. **Credentials are
never entered in chat or sent through the model** — only this terminal command sees
them. It finishes by printing the cost tiers so you know what publishing costs before
you ever approve a post.

Don't have an X developer app yet? Ask your agent for setup steps, then run
`npx social-promoter-mcp login` in the terminal for any actual keys. The agent follows
the `social-promoter` skill's `onboarding.md`. Other commands:

```bash
npx social-promoter-mcp status   # is an account connected?
npx social-promoter-mcp logout   # remove stored credentials
```

Credentials are resolved in this order: `X_API_KEY`/`X_API_SECRET`/`X_ACCESS_TOKEN`/
`X_ACCESS_SECRET` environment variables (handy for CI), then the stored login file.

### Credentials travel with you (no per-repo `.env`)

You connect **once** with `login`. The credentials live in your home directory at
`~/.social-promoter/credentials.json`, and the server reads them in **every repo and
every session**, so you do not need a `.env` file in each project. The server loads no
`.env` file of its own. The environment-variable path above exists for CI, deployment
hosts, or scripted setups. Anyone adopting the tool for personal use can do the same
one-time `login` and is then set everywhere.

## Voice profile (personalization)

Matching how you actually write is the difference between a post that sounds like you
and one that sounds like a competent stranger. Two pieces make that work:

1. **Full-text samples.** `find_latest_post` returns the target post's full body and
   prior posts as full-text tone samples (bounded per sample), so the model calibrates
   on real prose.
2. **A maintained voice profile.** `get_voice_profile` returns a short document you own
   that describes your traits, structure, signature devices, diction, and hard rules.

`get_voice_profile` resolves a voice file in this order (first match wins):

1. An explicit path you pass as `voiceFile`.
2. A workspace file in the current repo: `.social-promoter/voice.md`,
   `.social-promoter/voice-profile.md`, `voice-profile.md`, `VOICE.md`, or `voice.md`.
3. The global `~/.social-promoter/voice.md`, which applies in every repo.

Put it in the **workspace** to version-control it next to the posts it is derived from
and share it with anyone who clones the repo. Put it in the **home directory** to have
one profile that travels everywhere, like your credentials. If no file is found, the
tool returns a ready-to-save starter template so your agent can offer to create one.
Start from [`templates/voice-profile.template.md`](templates/voice-profile.template.md).

## Develop locally

```bash
npm install
npm run build
```

To run the in-development build from a checkout, point the MCP config at
`node dist/index.js` instead of `npx`.

To build the distributable MCP Bundle:

```bash
npm run bundle             # build/social-promoter-mcp.mcpb
npm run bundle -- --sign   # also self-sign it
```

## Workflow contract

1. `get_voice_profile` to load the author's voice rules (and offer to create one if missing).
2. `find_latest_post` to locate the source and sample tone from full post bodies.
3. The agent drafts variants in the author's voice.
4. Default to standalone, text-only drafts (no URL) unless the user explicitly asks to include a link.
5. If a URL is included, the draft must still read as a complete standalone post before the link.
6. `lint_voice` on each draft; rewrite anything with an error-level violation.
7. `estimate_cost` and show the tier.
8. Present drafts and stop. The user approves exact text.
9. `publish_post` with `confirmed: true`, one approved post per call.

## Test

```bash
npm run build
npm test
```

## Roadmap

- `init` command to copy [`../../skills/social/social-promoter/`](../../skills/social/social-promoter/) into a client skills directory automatically.
- Optional shared "sign in with X" OAuth app so users authorize in a browser instead of pasting keys (the credential storage layer is already abstracted for this).
- Optional `draft_posts` tool for clients without their own model.
- Decision-history log per post.
- Refactor the bundled VS Code extension into a thin client over the MCP server (it currently duplicates the logic).
