import type { ClaudeCredentials, CredentialSource } from "./types.js";
export declare function getCredentialFilePath(environment?: NodeJS.ProcessEnv): string;
export declare function parseCredentialsFile(contents: string): ClaudeCredentials | undefined;
export declare function createFileCredentialSource(path?: string): CredentialSource;
