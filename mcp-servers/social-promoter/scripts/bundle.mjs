import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Build a lean, self-contained MCPB bundle (.mcpb) for one-click install in
// clients that support MCP Bundles. Stages only what the server needs at
// runtime, installs production dependencies, then packs and reports the result.
//
// Usage:
//   node scripts/bundle.mjs          build + pack
//   node scripts/bundle.mjs --sign   also create a self-signed signature
//
// Output: build/social-promoter-mcp.mcpb

const root = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(root, "..", "..");
const buildDir = join(root, "build");
const stageDir = join(buildDir, "stage");
const outFile = join(buildDir, "social-promoter-mcp.mcpb");
const sign = process.argv.includes("--sign");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function quote(arg) {
    // When running through a shell, wrap anything with spaces/special chars in quotes.
    return /[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

function run(cmd, args, cwd) {
    console.log(`> ${cmd} ${args.join(" ")}`);
    // shell: true is required so Windows can resolve npm.cmd/npx.cmd (.cmd shims).
    const line = [cmd, ...args.map(quote)].join(" ");
    execSync(line, { cwd, stdio: "inherit" });
}

function mcpb(args, cwd) {
    run(npx, ["--no-install", "mcpb", ...args], cwd);
}

// Files and folders the runtime server needs inside the bundle.
const INCLUDE = [
    "manifest.json",
    "package.json",
    "package-lock.json",
    "dist",
    "templates",
    "README.md",
    "LICENSE",
];

console.log("1. Compiling TypeScript...");
run(npm, ["run", "build"], root);

console.log("\n2. Staging bundle contents...");
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(stageDir, { recursive: true });
for (const entry of INCLUDE) {
    const from = join(root, entry);
    if (!existsSync(from)) {
        if (entry === "README.md" || entry === "LICENSE") continue;
        throw new Error(`Required bundle input missing: ${entry}`);
    }
    cpSync(from, join(stageDir, entry), { recursive: true });
}

const socialPromoterSkill = join(repoRoot, "skills", "social", "social-promoter");
if (!existsSync(socialPromoterSkill)) {
    throw new Error("Required bundle input missing: skills/social/social-promoter");
}
cpSync(socialPromoterSkill, join(stageDir, "skill", "social-promoter"), { recursive: true });

console.log("\n3. Installing production dependencies into the bundle...");
run(npm, ["ci", "--omit=dev", "--ignore-scripts"], stageDir);

console.log("\n4. Packing the .mcpb archive...");
mcpb(["pack", stageDir, outFile], root);

if (sign) {
    console.log("\n5. Signing (self-signed)...");
    // Keep generated cert/key inside build/ so they never land in the repo root.
    mcpb(["sign", outFile, "--self-signed"], buildDir);
}

console.log("\n6. Bundle info:");
mcpb(["info", outFile], root);

console.log(`\nDone. Bundle written to ${outFile}`);
