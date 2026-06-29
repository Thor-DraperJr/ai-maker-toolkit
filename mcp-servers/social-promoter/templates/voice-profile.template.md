# Voice Profile

A description of how you write so an agent can draft in your voice. Keep it in your
own words and update it as your writing evolves. Drafting reads this; it never
invents a voice you have not described here.

## Where to save it

`get_voice_profile` resolves a file in this order (first match wins):

1. An explicit path you pass to the tool (`voiceFile`).
2. A workspace file in the repo you are working in, checked in this order:
   `.social-promoter/voice.md`, `.social-promoter/voice-profile.md`,
   `voice-profile.md`, `VOICE.md`, `voice.md`.
3. The global file `~/.social-promoter/voice.md`, which travels with you across
   every repo.

Pick based on how you want it to travel:

- **Workspace file** (recommended for a blog/content repo): version-controlled next
  to the posts it is derived from, and shareable with anyone who clones the repo.
- **Global file**: one profile that applies in every repo you work in, like your
  X credentials. Create it yourself at `~/.social-promoter/voice.md` when you want
  that.

If no file exists, `get_voice_profile` returns this template as a starter so the
agent can offer to save one for you.

---

## Who I am writing as
- Role / how I want to be seen (e.g. "operator and future tech leader, writing for a CIO/CISO/VP audience").
- One line on the perspective I write from (operator/coach, not vendor/seller).

## Voice traits (keep)
- Direct, conversational, practical.
- Confident without sounding stiff or inflated.
- Structured around a clear takeaway, a mental model, or a usable next move.
- Sounds like a real person, not a polished brand deck.

## Structure and signature devices
- How I open (a concrete hook, a personal stance, a question).
- Devices I reach for (mental models, ladders/levels, decision rules, short scorecards).
- How I close (a grounded forward-looking line, often a real question to the reader).

## Diction
- Words and framings I use.
- Words and framings I avoid.

## Hard rules (never)
- No emoji.
- No em-dashes or en-dashes used as punctuation.
- No "not X, it's Y" negative clarifications. State the positive claim.
- No AI-accent filler ("the goal is simple", "in today's fast-paced world", "game changer", "unlock").
- No customer names, internal roadmap dates, or unreleased details.

## Reference corpus
- Where my real writing lives (e.g. a posts directory) so the agent can sample full posts to calibrate.
