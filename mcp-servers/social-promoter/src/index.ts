#!/usr/bin/env node
import { CLI_COMMANDS, runCli } from "./cli.js";
import { startServer } from "./server.js";

async function main(): Promise<void> {
    const command = process.argv[2];

    // With a known subcommand, act as a human CLI (login/status/logout/help).
    // With no arguments, act as the MCP server over stdio (how agents launch it).
    if (command && CLI_COMMANDS.has(command)) {
        const code = await runCli(command);
        process.exit(code);
    }

    if (command) {
        await runCli(command);
        process.exit(1);
    }

    await startServer();
}

main().catch((error) => {
    console.error("social-promoter-mcp failed to start:", error);
    process.exit(1);
});
