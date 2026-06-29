import { spawn } from "node:child_process";

const child = spawn("node", ["dist/index.js"], { stdio: ["pipe", "pipe", "inherit"] });
let buf = "";
const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");

child.stdout.on("data", (d) => {
    buf += d.toString();
    for (const line of buf.split("\n")) {
        if (!line.trim()) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id === 2) {
            const names = (msg.result?.tools ?? []).map((t) => t.name).sort();
            console.log("tools:", names.join(", "));
            child.kill();
            process.exit(names.length === 9 ? 0 : 1);
        }
    }
});

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "0" } } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
setTimeout(() => { console.error("timeout"); child.kill(); process.exit(1); }, 5000);
