import type { ClaudeCredentials } from "./credentials/index.js";

export function describeCredentials(
	credentials: ClaudeCredentials | undefined,
): string[] {
	if (!credentials) {
		return [
			"Credenciais do Claude Code não encontradas ou expiradas. Rode `claude` para autenticar.",
		];
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
