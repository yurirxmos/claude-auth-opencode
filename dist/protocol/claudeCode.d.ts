export declare const CLAUDE_CLI_VERSION = "2.1.300";
export declare const CLAUDE_CODE_ENTRYPOINT = "sdk-cli";
export declare const CLAUDE_CODE_IDENTITY = "You are a Claude agent, built on Anthropic's Claude Agent SDK.";
export declare const BILLING_HEADER_PREFIX = "x-anthropic-billing-header";
/**
 * Beta flags sent by Claude Code 2.1.300 for OAuth-authenticated requests.
 * Captured from the official CLI on 2026-10-15.
 */
export declare const CLAUDE_CODE_BETAS: readonly ["claude-code-20250219", "oauth-2025-04-20", "interleaved-thinking-2025-05-14", "thinking-token-count-2026-05-13", "context-management-2025-06-27", "prompt-caching-scope-2026-01-05", "per-turn-control-2026-07-01", "mid-conversation-tool-changes-2026-07-01", "inline-tools-2026-09-15", "advisor-tool-2026-03-01", "effort-2025-11-24", "extended-cache-ttl-2025-04-11"];
/**
 * Betas the API rejects for some subscriptions with
 * "The long context beta is not yet available for this subscription".
 * They are dropped on retry; 1M context works without the legacy flag.
 */
export declare const LONG_CONTEXT_BETAS: readonly ["context-1m-2025-08-07"];
export declare function extractFirstUserMessageText(messages: unknown): string;
export declare function computeCch(messageText: string): string;
export declare function computeVersionSuffix(messageText: string, version: string): string;
export declare function buildBillingHeaderValue(messages: unknown, version?: string): string;
export declare function getStainlessHeaders(): Record<string, string>;
export interface ClaudeCodeHeaderInput {
    accessToken: string;
    sessionID: string;
    incomingBetas?: string | null;
    excludeBetas?: ReadonlySet<string>;
}
export declare function buildClaudeCodeHeaders(input: ClaudeCodeHeaderInput): Record<string, string>;
/**
 * Rewrites an Anthropic Messages request so it is accepted when authenticated
 * with Claude Code OAuth credentials.
 *
 * Anthropic only accepts OAuth-authenticated traffic that carries the Claude
 * Code billing header and identity as `system[0]`/`system[1]`. Any other system
 * prompt must be moved into the first user message, otherwise the request is
 * rejected as if the account were out of quota.
 */
export declare function transformClaudeCodeBody(rawBody: string): string;
