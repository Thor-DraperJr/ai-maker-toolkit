# Workflows

Workflows are repeatable ways to combine skills, agents, prompts, and human gates. They are not GitHub Actions. They are playbooks for work that has more than one step and more than one judgment call.

This folder is the public workflow package shelf. Repo-local entry points for workflows this repo actually uses live under `.github/prompts/`, where VS Code can discover them without duplicating the full package documentation.

A workflow belongs here when it answers:

| Question | Example |
|---|---|
| What starts it? | A finished article, a coding session, a talk idea, or a career reflection. |
| What does the agent do? | Scan, draft, build, review, revise, or prepare a publish-ready artifact. |
| What tools or skills does it call? | Article visuals, voice editor, social promoter, browser review, or a repo-specific skill. |
| Where is the human gate? | Before publishing, posting, spending money, or claiming something is ready. |
| What proof shows it worked? | Screenshots, links, final drafts, rubric results, or a public artifact. |

## Likely Workflow Families

| Workflow | Uses | Status |
|---|---|---|
| [Repo prune and publish review](maintenance/repo-prune-and-publish-review/) | Repo Pruner Skill, Voice & Publish Editor, link checks, package validation | Started here |
| Article to visual article | Article Visuals Skill, browser proof, Voice & Publish Editor | Started here |
| Article to social posts | Social promoter skill, voice profile, cost guardrail, approval gate | Candidate |
| Session to lesson learned | Social promoter skill, Voice & Publish Editor, human approval | Candidate |
| Content deliverable loop | Article visuals, screenshots, rubric review, publish gate | Candidate |

## Package Shape

```text
workflows/<category>/<workflow-name>/
	README.md
	images/      # optional proof or screenshots
	examples/    # optional concrete inputs or outputs
```

Each workflow package should include the trigger, steps, skills or agents involved, proof, and the human gate. Keep workflow READMEs short enough that someone can copy the idea without adopting a framework.
