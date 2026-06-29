---
name: article-visuals
version: 0.1.0
description: "Use when: scanning articles for visual opportunities, building article visuals or animated HTML components, adding optional present mode, or validating article-to-presentation work in the browser."
---

# Agentic Article Visuals And HTML Present Mode

Use this skill to scan an article, outline, transcript, or rough idea for visual opportunities, build article visual aids and animated HTML components, and add optional present mode while keeping the article as the source of truth.

## When To Use

Use this skill when the user wants to:

- Scan an article for visual opportunities and ranked infographic ideas.
- Create present mode from an article, outline, transcript, or rough idea.
- Add a presentation button to an article or docs page.
- Build animated visual aids for articles.
- Convert source material into an article visual people can learn from.
- Validate presentation or animation output in a browser.
- Create a reusable workflow for article-to-presentation work.

## Core Principle

The article or source material remains the source of truth. Visuals start with an opportunity scan, not decoration. Present mode is optional. Visuals and animation earn their place by teaching sequence, state, flow, contrast, hierarchy, scale, or before/after change.

## Workflow

1. Classify the artifact: article-only, visual-heavy, presentation-ready, or standalone HTML presentation.
2. Scan the source for visual opportunities and rank the best infographic or animated-component ideas.
3. Write an artifact brief.
4. Write visual briefs for any graphic, animation, or component.
5. Decide whether present mode earns a button or route.
6. Build using the repo's existing article, component, and route patterns.
7. Render in a browser and inspect screenshots.
8. Fix layout, clipping, timing, and unclear motion.
9. Run the voice editor on any written prose after structure is stable.
10. Run repo hygiene before publishing.

## Inputs

- Source material.
- Target audience.
- Desired reader or audience outcome.
- Existing framework or repo patterns.
- Research targets, public examples, or product references that can inform visual design.
- Presentation viewport or target device.
- Publish constraints.

## Outputs

- Artifact brief.
- Visual opportunity scan.
- Visual brief.
- Deck contract or present-mode contract.
- Implementation plan.
- Browser validation plan.
- Voice editor pass for written prose.
- Repo hygiene checklist.

## Verified Scope

This skill is verified against an Astro blog where Markdown articles can opt into visual components and a `/present/` route. For other stacks, reuse the same judgment but do not assume the file paths or route shape are already known. Explore the target repo first, then adapt to its existing article, component, routing, and validation patterns.

## Validation

For any visual or presentation work, source inspection is not enough.

Run a browser check when possible and inspect screenshots for:

- Clipping.
- Overlap.
- Unreadable labels.
- Motion that starts before the line/state it depends on exists.
- Placeholder logos or silent fallbacks.
- Mobile and presentation-viewport behavior.

## Voice Gate

For written artifacts, run the voice editor before calling them ready to publish or share. Preserve the author's natural cadence, point of view, concrete judgment, and lived experience. Remove generic AI phrasing and over-polished transitions without flattening the writing into a generic brand voice.

## Human Gates

Ask before committing, pushing, publishing, or taking paid actions. Never treat generated screenshots, audit folders, or scratch clones as source unless the user explicitly asks to preserve them as durable evidence.
