#!/usr/bin/env node
import { applyCompression } from "./apply.js";
import { retrieve } from "./store.js";
import { stats } from "./index.js";
// `winnow` CLI: bench | mcp | compress (stdin) | retrieve <id>. Local-first, no network.
const USAGE = `winnow — local-first context compression for AI agents

Usage:
  winnow bench              Run the fidelity benchmark (savings + needle survival)
  winnow compress           Compress stdin, print the result to stdout
  winnow retrieve <id>      Print a stored original by id
  winnow mcp                Start the MCP server (stdio): winnow_compress/retrieve/stats
  winnow help               Show this help`;
async function readStdin() {
    const chunks = [];
    for await (const c of process.stdin)
        chunks.push(c);
    return Buffer.concat(chunks).toString("utf8");
}
async function main() {
    const [cmd, ...rest] = process.argv.slice(2);
    switch (cmd) {
        case "bench": {
            const { runFidelity, formatFidelity } = await import("./bench/fidelity.js");
            console.log(formatFidelity(runFidelity()));
            return 0;
        }
        case "compress": {
            const input = await readStdin();
            const r = await applyCompression(input);
            process.stdout.write(r.text + "\n");
            console.error(JSON.stringify(stats(input, r.text)));
            return 0;
        }
        case "retrieve": {
            const id = rest[0];
            if (!id) {
                console.error("usage: winnow retrieve <id>");
                return 1;
            }
            const original = await retrieve(id);
            if (original === null) {
                console.error(`no stored original for id "${id}"`);
                return 1;
            }
            process.stdout.write(original);
            return 0;
        }
        case "mcp": {
            const { startMcpServer } = await import("./mcp/server.js");
            await startMcpServer();
            return 0;
        }
        case "help":
        case "-h":
        case "--help":
        case undefined:
            console.log(USAGE);
            return 0;
        default:
            console.error(`unknown command: ${cmd}\n\n${USAGE}`);
            return 1;
    }
}
main().then((code) => process.exit(code)).catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
});
//# sourceMappingURL=cli.js.map