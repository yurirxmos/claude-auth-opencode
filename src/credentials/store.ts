import type { ClaudeCredentials, CredentialSource } from "./types.js";

export class CredentialStore {
	private cached?: { credentials: ClaudeCredentials; expiresAt: number };

	public constructor(
		private readonly sources: readonly CredentialSource[],
		private readonly cacheDurationMilliseconds = 30_000,
		private readonly now: () => number = Date.now,
	) {}

	public async getValidCredentials(): Promise<ClaudeCredentials | undefined> {
		if (
			this.cached &&
			this.cached.expiresAt > this.now() &&
			!isExpired(this.cached.credentials, this.now())
		) {
			return this.cached.credentials;
		}

		for (const source of this.sources) {
			const credentials = await source.load();
			if (!credentials || isExpired(credentials, this.now())) continue;

			this.cached = {
				credentials,
				expiresAt: this.now() + this.cacheDurationMilliseconds,
			};
			return credentials;
		}

		this.cached = undefined;
		return undefined;
	}

	public clear(): void {
		this.cached = undefined;
	}
}

function isExpired(credentials: ClaudeCredentials, now: number): boolean {
	return credentials.expiresAt !== undefined && credentials.expiresAt <= now;
}
