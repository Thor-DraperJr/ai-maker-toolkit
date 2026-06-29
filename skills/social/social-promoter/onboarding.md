# Onboarding: Connect an X Account

Use this the first time someone wants to publish (not just draft). The goal is to
get them from "no X access" to "connected" with the agent doing the explaining and
the user doing only the clicking and one terminal command. Drafting never needs any
of this; only publishing does.

## When to run onboarding

Trigger this when the user asks to publish and `npx social-promoter-mcp status`
reports not connected, or `publish_post` returns a dry run because no credentials
were found. Do not run it preemptively. If the user only wants drafts, skip it.

## The security line you must not cross

Credentials (API keys, secrets, tokens) must NEVER be typed into chat, pasted to
the agent, or sent through any tool. They are entered only in the user's own
terminal, by the `login` command, which stores them locally. If a user tries to
paste a key to you, stop them and point them to the terminal command instead.

## Credentials travel; no per-repo `.env`

Connecting is a one-time step. The `login` command stores the four values in
`~/.social-promoter/credentials.json`, and the MCP server reads them in every repo
and every session. Users do not need a `.env` file in each project, and the server
loads no `.env` of its own. Environment variables are only for CI.

## If they installed via the MCP Bundle (.mcpb)

Bundle users can fill their four X keys into the bundle's config fields when they install
it, instead of running `login`. The fields are optional and stored securely by the
client. The same security line still applies: those values are entered into the client's
own config UI, never pasted into chat or sent through a tool. If a bundle user has not
filled them in and wants to publish, either have them add the keys in the bundle's config
or run `npx social-promoter-mcp login` as below; both work.

## What the user needs

Four values from a personal X developer app (OAuth 1.0a, user context):

1. API Key (consumer key)
2. API Key Secret (consumer secret)
3. Access Token
4. Access Token Secret

The app must have Read and Write permission so it can post.

## Walk them through it

Explain these steps conversationally, one cluster at a time, and wait for them to
catch up. Do not dump the whole list at once.

1. **Create a developer account.** Go to https://developer.x.com and sign in with
   the X account they want to post from. Sign up for the free tier if prompted.
2. **Create an app/project.** In the developer portal, create a Project and an App
   inside it. Any name is fine.
3. **Set permissions to Read and Write.** In the app's settings, under User
   authentication settings, set app permissions to "Read and write." This must be
   done BEFORE generating the access token, or the token will be read-only and
   posting will fail with a 403.
4. **Generate the four values.** On the app's Keys and tokens tab:
   - Copy the API Key and API Key Secret (consumer keys).
   - Generate and copy the Access Token and Access Token Secret.
   - Tell them to copy these somewhere safe for a moment; X only shows secrets once.
5. **Run the login command.** Have them run, in their own terminal:

   ```
   npx social-promoter-mcp login
   ```

   It prompts for each of the four values. Typed input is hidden. It verifies the
   credentials with X, stores them locally (in `~/.social-promoter/credentials.json`,
   permission-locked), and prints the cost tiers. Nothing is sent through chat.

## Common failures and what to say

- **403 / "client-not-enrolled" or read-only when posting:** permissions were not
  set to Read and Write before the access token was generated. Fix permissions,
  regenerate the access token and secret, run `login` again.
- **402 / "CreditsDepleted":** the X account needs prepaid API credits or a paid
  tier before it can post. Drafting still works; publishing will not until credits
  are added.
- **"Could not verify these credentials":** a value was mistyped. X only shows
  secrets once, so they may need to regenerate the access token/secret and retry.

## After connecting

Once `status` shows connected, the normal workflow applies: load the voice profile,
draft, lint, show the cost, stop at the approval gate, and publish only the one exact
text the user approves. Re-running `login` updates the stored credentials; `logout`
removes them.
