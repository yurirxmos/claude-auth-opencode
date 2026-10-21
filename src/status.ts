import type { ClaudeCredentials } from "./credentials/index.js";
import { CLAUDE_CREDENTIALS_EXPIRED_MESSAGE } from "./auth.js";

export function describeCredentials(
	credentials: ClaudeCredentials | undefined,
): string[] {
	if (!credentials) {
		return [CLAUDE_CREDENTIALS_EXPIRED_MESSAGE];
	}

	const expiration =
		credentials.expiresAt === undefined
			? "não informada"
			: new Date(credentials.expiresAt).toISOString();

	return [
		"Credenciais do Claude Code encontradas.",
		`Expiração: ${expiration}`,
	];
}
