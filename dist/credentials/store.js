export class CredentialStore {
    sources;
    cacheDurationMilliseconds;
    now;
    cached;
    constructor(sources, cacheDurationMilliseconds = 30_000, now = Date.now) {
        this.sources = sources;
        this.cacheDurationMilliseconds = cacheDurationMilliseconds;
        this.now = now;
    }
    async getValidCredentials() {
        if (this.cached &&
            this.cached.expiresAt > this.now() &&
            !isExpired(this.cached.credentials, this.now())) {
            return this.cached.credentials;
        }
        for (const source of this.sources) {
            const credentials = await source.load();
            if (!credentials || isExpired(credentials, this.now()))
                continue;
            this.cached = {
                credentials,
                expiresAt: this.now() + this.cacheDurationMilliseconds,
            };
            return credentials;
        }
        this.cached = undefined;
        return undefined;
    }
    clear() {
        this.cached = undefined;
    }
}
function isExpired(credentials, now) {
    return credentials.expiresAt !== undefined && credentials.expiresAt <= now;
}
