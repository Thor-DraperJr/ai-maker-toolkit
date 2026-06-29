import { createInterface } from "node:readline";
import { TwitterApi } from "twitter-api-v2";
import {
    clearCredentials,
    configPath,
    getStatus,
    saveCredentials,
    type XCredentials,
} from "./credentials.js";

const COST_NOTICE = [
    "Cost, so there are no surprises later:",
    "  Text-only post: about $0.015",
    "  Post with a link: about $0.200",
    "",
    "Drafting is always free. Every publish asks you to approve the exact text",
    "and shows the price before anything is sent. Nothing posts on its own.",
].join("\n");

/** Prompt for a line of input. When hidden, typed characters are not echoed. */
function prompt(question: string, hidden = false): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
        const tty = rl as unknown as { _writeToOutput?: (s: string) => void };
        tty._writeToOutput = (str: string) => {
            // Echo the question text, but mask the secret the user types.
            if (str.includes(question)) {
                process.stdout.write(str);
            }
        };
    }
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            if (hidden) {
                process.stdout.write("\n");
            }
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function runLogin(): Promise<number> {
    console.log("Connect your X account to Social Promoter.\n");
    console.log("You'll paste four values from your X developer app. They are stored only");
    console.log(`on this machine, in ${configPath()}, and never sent through chat.\n`);
    console.log("If you don't have these yet, ask your agent to walk you through creating an");
    console.log("X developer app, or see https://developer.x.com.\n");

    const appKey = await prompt("API Key (consumer key): ", true);
    const appSecret = await prompt("API Key Secret (consumer secret): ", true);
    const accessToken = await prompt("Access Token: ", true);
    const accessSecret = await prompt("Access Token Secret: ", true);

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.error("\nAll four values are required. Nothing was saved.");
        return 1;
    }

    const creds: XCredentials = { appKey, appSecret, accessToken, accessSecret };

    console.log("\nVerifying with X...");
    try {
        const client = new TwitterApi(creds);
        const me = await client.v2.me();
        const handle = me?.data?.username ? `@${me.data.username}` : "your account";
        const path = saveCredentials(creds);
        console.log(`Connected as ${handle}. Credentials saved to ${path}.\n`);
        console.log(COST_NOTICE);
        console.log("\nYou're set. Ask your agent to draft a post whenever you're ready.");
        return 0;
    } catch (error) {
        const message = (error as { message?: string })?.message ?? "Unknown error";
        console.error(`\nCould not verify these credentials with X: ${message}`);
        console.error("Nothing was saved. Double-check the four values and that your app has");
        console.error("Read and Write permissions, then run login again.");
        return 1;
    }
}

function runStatus(): number {
    const status = getStatus();
    if (!status.configured) {
        console.log("Not connected. Run `npx social-promoter-mcp login` to connect your X account.");
        return 0;
    }
    const where = status.source === "env" ? "environment variables" : status.configPath;
    console.log(`Connected. Credentials are read from ${where}.`);
    return 0;
}

function runLogout(): number {
    const removed = clearCredentials();
    console.log(
        removed
            ? `Disconnected. Removed ${configPath()}.`
            : "No stored credentials to remove.",
    );
    return 0;
}

function runHelp(): number {
    console.log(
        [
            "social-promoter-mcp - portable social-promotion workflow for agents",
            "",
            "Usage:",
            "  npx social-promoter-mcp            Start the MCP server (used by your agent).",
            "  npx social-promoter-mcp login      Connect your X account (stored locally).",
            "  npx social-promoter-mcp status     Show whether an X account is connected.",
            "  npx social-promoter-mcp logout     Remove stored credentials.",
            "  npx social-promoter-mcp help       Show this help.",
        ].join("\n"),
    );
    return 0;
}

/** Handle a human CLI subcommand. Returns the process exit code. */
export async function runCli(command: string): Promise<number> {
    switch (command) {
        case "login":
            return runLogin();
        case "status":
            return runStatus();
        case "logout":
            return runLogout();
        case "help":
        case "--help":
        case "-h":
            return runHelp();
        default:
            console.error(`Unknown command: ${command}\n`);
            runHelp();
            return 1;
    }
}

export const CLI_COMMANDS = new Set(["login", "status", "logout", "help", "--help", "-h"]);
