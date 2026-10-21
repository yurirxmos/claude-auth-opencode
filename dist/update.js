import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
const executeFile = promisify(execFile);
export const PACKAGE_NAME = "claude-auth-opencode";
const REGISTRY_LATEST_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
function parseVersion(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
    return match ? match.slice(1).map(Number) : undefined;
}
export function isNewerVersion(candidate, current) {
    const next = parseVersion(candidate);
    const installed = parseVersion(current);
    if (!next || !installed)
        return false;
    for (let index = 0; index < next.length; index += 1) {
        const difference = (next[index] ?? 0) - (installed[index] ?? 0);
        if (difference !== 0)
            return difference > 0;
    }
    return false;
}
async function readInstalledVersion() {
    const contents = await readFile(new URL("../package.json", import.meta.url), "utf8");
    const version = JSON.parse(contents).version;
    return typeof version === "string" ? version : undefined;
}
async function fetchLatestVersion() {
    const response = await fetch(REGISTRY_LATEST_URL, {
        signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok)
        return undefined;
    const version = (await response.json()).version;
    return typeof version === "string" ? version : undefined;
}
export async function findAvailableUpdate() {
    try {
        const [current, latest] = await Promise.all([
            readInstalledVersion(),
            fetchLatestVersion(),
        ]);
        if (!current || !latest || !isNewerVersion(latest, current)) {
            return undefined;
        }
        return { current, latest };
    }
    catch {
        // Update checks must never interfere with OpenCode startup.
        return undefined;
    }
}
async function runOpenCode(arguments_) {
    await executeFile("opencode", [...arguments_], {
        timeout: 120_000,
        // npm-installed CLIs are .cmd shims on Windows.
        shell: process.platform === "win32",
    });
}
export function installUpdate() {
    return runOpenCode(["plugin", "update", PACKAGE_NAME]);
}
export function restartOpenCodeService() {
    return runOpenCode(["service", "restart"]);
}
