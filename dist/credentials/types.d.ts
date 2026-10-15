export interface ClaudeCredentials {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}
export interface CredentialSource {
    id: string;
    label: string;
    load(): Promise<ClaudeCredentials | undefined>;
}
export interface CredentialFileContents {
    claudeAiOauth?: {
        accessToken?: unknown;
        refreshToken?: unknown;
        expiresAt?: unknown;
    };
}
