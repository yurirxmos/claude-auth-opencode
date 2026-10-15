import type { ClaudeCredentials, CredentialSource } from "./types.js";
export declare class CredentialStore {
    private readonly sources;
    private readonly cacheDurationMilliseconds;
    private readonly now;
    private cached?;
    constructor(sources: readonly CredentialSource[], cacheDurationMilliseconds?: number, now?: () => number);
    getValidCredentials(): Promise<ClaudeCredentials | undefined>;
    clear(): void;
}
