# Agents

Agents are specialist collaborators with a narrower job than the main chat agent. They are useful when a task needs a focused reviewer, a separate context window, or a repeatable late-stage pass.

This folder is the public agent package shelf. The actual repo-local agent files that VS Code uses live under `.github/agents/`.

## Current Agents

| Agent | Job | Live File |
|---|---|---|
| [Voice & Publish Editor](publishing/voice-publish-editor/) | Late-stage voice, copy, consistency, and publish-readiness review. | [.github/agents/voice-publish-editor.agent.md](../.github/agents/voice-publish-editor.agent.md) |

## Package Shape

```text
agents/<category>/<agent-name>/
  README.md
  images/      # optional proof or screenshots
  examples/    # optional sample prompts or outputs
```

Each agent package should explain the job, when to call it, the copy path, proof from real use, and why the agent is useful.