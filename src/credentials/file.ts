import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type {
	ClaudeCredentials,
	CredentialFileContents,
	CredentialSource,
} from "./types.js";

const DEFAULT_CLAUDE_DIRECTORY = ".claude";

export function getCredentialFilePath(
	environment: NodeJS.ProcessEnv = process.env,
): string {
	const configuredDirectory = environment.CLAUDE_CONFIG_DIR;
	const directory =
		configuredDirectory && configuredDirectory.trim().length > 0
			? configuredDirectory
			: join(homedir(), DEFAULT_CLAUDE_DIRECTORY);

	return join(directory, ".credentials.json");
}

export function parseCredentialsFile(
	contents: string,
): ClaudeCredentials | undefined {
	let parsed: CredentialFileContents;

	try {
		parsed = JSON.parse(contents) as CredentialFileContents;
	} catch {
		return undefined;
	}

	const credentials = parsed.claudeAiOauth;
	if (
		!credentials ||
		typeof credentials.accessToken !== "string" ||
		credentials.accessToken.length === 0
	) {
		return undefined;
	}

	return {
		accessToken: credentials.accessToken,
		...(typeof credentials.refreshToken === "string" &&
		credentials.refreshToken.length > 0
			? { refreshToken: credentials.refreshToken }
			: {}),
		...(typeof credentials.expiresAt === "number" &&
		Number.isFinite(credentials.expiresAt)
			? { expiresAt: credentials.expiresAt }
			: {}),
	};
}

export function createFileCredentialSource(
	path = getCredentialFilePath(),
): CredentialSource {
	return {
		id: "credentials-file",
		label: "Claude Code credentials file",
		async load(): Promise<ClaudeCredentials | undefined> {
			try {
				return parseCredentialsFile(await readFile(path, "utf8"));
			} catch {
				return undefined;
			}
		},
	};
}
