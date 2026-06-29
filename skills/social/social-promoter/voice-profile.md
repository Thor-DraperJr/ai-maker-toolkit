# Voice Profile: Sound Like the Author

The voice profile is a short, human-authored document that tells you how the author
writes. Combined with full-text post samples from `find_latest_post`, it is what makes
a draft sound like the author instead of like a competent stranger. Voice matching is
your job as the model; the tools give you the raw material, they do not approximate the
voice with keyword math.

## Voice sources: more than a posts directory

A posts directory is the easiest source, but it is not the only one. When building or
refining a profile, accept whatever real writing the author can give you and treat it
all as voice signal:

- **A posts/blog directory** — point `find_latest_post`/`get_voice_profile` at it
  (`postsDir`) for full-text samples and a corpus summary.
- **Individual blog files or a published URL** — read the file, or fetch the link, and
  use the prose directly.
- **Pasted samples** — the author drops a few representative pieces straight into chat
  (posts, newsletters, README intros, conference abstracts).
- **Transcripts** — talk, podcast, or meeting transcripts. These capture how the author
  actually speaks, which is gold for an authentic voice. Strip filler and attributions,
  keep their phrasing and cadence.

The more varied and real the material, the better the match. When the author offers
content, ask if they want it folded into the saved profile so future sessions inherit it.

## Load it first

At the start of any drafting task, call `get_voice_profile`. Pass `postsDir` when you
have a posts directory so you also get a corpus summary (post count, date range,
recurring themes).

The tool resolves a voice file in this order (first match wins):

1. An explicit path passed as `voiceFile`.
2. A workspace file: `.social-promoter/voice.md`, `.social-promoter/voice-profile.md`,
   `voice-profile.md`, `VOICE.md`, or `voice.md`.
3. The global `~/.social-promoter/voice.md`, which applies in every repo.

## When none exists

If `get_voice_profile` returns `found: false`, it includes a ready-to-save starter
template. Do not silently invent a voice. Instead:

1. Offer to create a voice profile for the user.
2. Ask where it should live:
   - a **workspace file** (`.social-promoter/voice.md`) to version-control it next to
     the posts it is derived from and share it with anyone who clones the repo, or
   - the **global** `~/.social-promoter/voice.md` to apply it in every repo.
3. Offer to draft a first version from their existing writing. Use any voice source
   above: read several full posts with `find_latest_post` (vary the dates), or work from
   blogs/transcripts/samples the author drops in. Infer recurring traits, structure,
   opening and closing moves, diction, and hard rules, and fill in the template sections.
4. Have the user review and edit. The profile is theirs; keep it in their words.

## Keep it honest

- Describe the voice the author actually has, not an aspirational one.
- Capture signature devices (mental models, ladders, decision rules, scorecards),
  how they open and close, and the phrasings they avoid.
- Encode hard rules the lint can enforce: no emoji, no em-dashes, no "not X, it's Y"
  clarifications, no AI-accent filler.
- Update the profile as the author's writing evolves.

## For people adopting this tool

Tell new users the personalization works best when they:

1. Give the tool real source material: a directory of their published writing, or a few
   pasted blogs/transcripts/talks if they do not keep a blog folder.
2. Save a voice profile (start from `templates/voice-profile.template.md` in the repo).
3. Keep writing. More real source material means a better voice match.
