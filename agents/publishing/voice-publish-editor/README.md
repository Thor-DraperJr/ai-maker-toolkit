# Voice & Publish Editor

A repo-local agent for late-stage voice review, copyediting, consistency checks, and publish readiness.

Use this agent after structure, visuals, and strategy are stable. Its job is to preserve Thor's voice, catch mechanical issues, and flag publish-readiness problems without reopening the whole piece.

## What It Does

| Job | Outcome |
|---|---|
| Voice review | Keeps direct, practical, operator-style prose and reduces generic AI phrasing. |
| Copyedit | Finds typos, repeated words, grammar issues, awkward headings, and broken Markdown. |
| Visual article balance | Checks whether prose still teaches when screenshots or embedded visuals are not visible. |
| Publish readiness | Flags placeholders, unsupported claims, internal-sounding language, and final risks. |

## Copy Path

Copy the agent into a target repo:

```text
.github/agents/voice-publish-editor.agent.md
```

The live file in this repo is [.github/agents/voice-publish-editor.agent.md](../../../.github/agents/voice-publish-editor.agent.md).

## First Prompt

```text
Use the Voice & Publish Editor.
Review README.md in review-only mode.
Preserve Thor's voice, flag mechanical issues, and return publish-readiness notes.
```

The agent is review-only by default. Ask it to edit only when you want direct file changes.

## Proof

This agent was used to review the Markdown in this repo before publishing. Its review caught vague positioning, overly polished phrasing, and copy-path consistency issues.

## Why It Is Useful

AI can help draft and reshape writing quickly, but it can also make everything sound a little too smooth and generic. This agent gives the final pass a clear job: keep the voice direct, catch mechanical problems, and flag anything that does not feel ready to publish.