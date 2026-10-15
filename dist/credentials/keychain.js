import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseCredentialsFile } from "./file.js";
const executeFile = promisify(execFile);
const KEYCHAIN_SERVICE = "Claude Code-credentials";
export function createMacOSKeychainCredentialSource() {
    return {
        id: "macos-keychain",
        label: "macOS Keychain",
        async load() {
            if (process.platform !== "darwin")
                return undefined;
            try {
                const { stdout } = await executeFile("security", ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"], {
                    encoding: "utf8",
                });
                return parseCredentialsFile(stdout);
            }
            catch {
                return undefined;
            }
        },
    };
}
