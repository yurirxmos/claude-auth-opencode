import { createHash } from "node:crypto";
export const CLAUDE_CLI_VERSION = "2.1.300";
export const CLAUDE_CODE_ENTRYPOINT = "sdk-cli";
export const CLAUDE_CODE_IDENTITY = "You are a Claude agent, built on Anthropic's Claude Agent SDK.";
export const BILLING_HEADER_PREFIX = "x-anthropic-billing-header";
/**
 * Beta flags sent by Claude Code 2.1.300 for OAuth-authenticated requests.
 * Captured from the official CLI on 2026-10-15.
 */
export const CLAUDE_CODE_BETAS = [
    "claude-code-20250219",
    "oauth-2025-04-20",
    "interleaved-thinking-2025-05-14",
    "thinking-token-count-2026-05-13",
    "context-management-2025-06-27",
    "prompt-caching-scope-2026-01-05",
    "per-turn-control-2026-07-01",
    "mid-conversation-tool-changes-2026-07-01",
    "inline-tools-2026-09-15",
    "advisor-tool-2026-03-01",
    "effort-2025-11-24",
    "extended-cache-ttl-2025-04-11",
];
/**
 * Betas the API rejects for some subscriptions with
 * "The long context beta is not yet available for this subscription".
 * They are dropped on retry; 1M context works without the legacy flag.
 */
export const LONG_CONTEXT_BETAS = ["context-1m-2025-08-07"];
const BILLING_SALT = "59cf53e54c78";
export function extractFirstUserMessageText(messages) {
    if (!Array.isArray(messages))
        return "";
    const userMessage = messages.find((message) => typeof message === "object" &&
        message !== null &&
        message.role === "user");
    if (!userMessage)
        return "";
    const content = userMessage.content;
    if (typeof content === "string")
        return content;
    if (Array.isArray(content)) {
        const textBlock = content.find((block) => typeof block === "object" &&
            block !== null &&
            block.type === "text");
        return textBlock?.text ?? "";
    }
    return "";
}
export function computeCch(messageText) {
    return createHash("sha256").update(messageText).digest("hex").slice(0, 5);
}
export function computeVersionSuffix(messageText, version) {
    const sampled = [4, 7, 20]
        .map((index) => (index < messageText.length ? messageText[index] : "0"))
        .join("");
    return createHash("sha256")
        .update(`${BILLING_SALT}${sampled}${version}`)
        .digest("hex")
        .slice(0, 3);
}
export function buildBillingHeaderValue(messages, version = CLAUDE_CLI_VERSION) {
    const text = extractFirstUserMessageText(messages);
    const suffix = computeVersionSuffix(text, version);
    const cch = computeCch(text);
    return `x-anthropic-billing-header: cc_version=${version}.${suffix}; cc_entrypoint=${CLAUDE_CODE_ENTRYPOINT}; cch=${cch};`;
}
export function getStainlessHeaders() {
    return {
        "x-stainless-arch": process.arch === "arm64" ? "arm64" : process.arch,
        "x-stainless-lang": "js",
        "x-stainless-os": process.platform === "darwin" ? "MacOS" : process.platform,
        "x-stainless-package-version": "0.128.0",
        "x-stainless-retry-count": "0",
        "x-stainless-runtime": "node",
        "x-stainless-runtime-version": process.version,
        "x-stainless-timeout": "600",
    };
}
export function buildClaudeCodeHeaders(input) {
    const excluded = input.excludeBetas ?? new Set();
    const mergedBetas = [
        ...new Set([
            ...CLAUDE_CODE_BETAS,
            ...(input.incomingBetas ?? "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
        ]),
    ]
        .filter((beta) => !excluded.has(beta))
        .join(",");
    return {
        authorization: `Bearer ${input.accessToken}`,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": mergedBetas,
        "anthropic-dangerous-direct-browser-access": "true",
        "x-app": "cli",
        "user-agent": process.env.ANTHROPIC_USER_AGENT ??
            `claude-cli/${CLAUDE_CLI_VERSION} (external, sdk-cli)`,
        "x-claude-code-session-id": input.sessionID,
        ...getStainlessHeaders(),
    };
}
/**
 * Rewrites an Anthropic Messages request so it is accepted when authenticated
 * with Claude Code OAuth credentials.
 *
 * Anthropic only accepts OAuth-authenticated traffic that carries the Claude
 * Code billing header and identity as `system[0]`/`system[1]`. Any other system
 * prompt must be moved into the first user message, otherwise the request is
 * rejected as if the account were out of quota.
 */
export function transformClaudeCodeBody(rawBody) {
    let parsed;
    try {
        parsed = JSON.parse(rawBody);
    }
    catch {
        return rawBody;
    }
    const billingHeader = buildBillingHeaderValue(parsed.messages, process.env.ANTHROPIC_CLI_VERSION ?? CLAUDE_CLI_VERSION);
    const incomingSystem = Array.isArray(parsed.system)
        ? parsed.system
        : [];
    const keptSystem = [];
    const movedTexts = [];
    for (const entry of incomingSystem) {
        const text = typeof entry === "string" ? entry : (entry.text ?? "");
        if (typeof text === "string" && text.startsWith(BILLING_HEADER_PREFIX))
            continue;
        if (typeof text === "string" && text.startsWith(CLAUDE_CODE_IDENTITY))
            continue;
        if (typeof text === "string" && text.length > 0)
            movedTexts.push(text);
    }
    keptSystem.push({ type: "text", text: billingHeader });
    keptSystem.push({ type: "text", text: CLAUDE_CODE_IDENTITY });
    if (movedTexts.length > 0 && Array.isArray(parsed.messages)) {
        const firstUser = parsed.messages.find((message) => message.role === "user");
        if (firstUser) {
            const prefix = movedTexts.join("\n\n");
            if (typeof firstUser.content === "string") {
                firstUser.content = `${prefix}\n\n${firstUser.content}`;
            }
            else if (Array.isArray(firstUser.content)) {
                firstUser.content.unshift({
                    type: "text",
                    text: prefix,
                });
            }
        }
        else {
            keptSystem.push(...movedTexts.map((text) => ({ type: "text", text })));
        }
    }
    else {
        keptSystem.push(...movedTexts.map((text) => ({ type: "text", text })));
    }
    parsed.system = keptSystem;
    return JSON.stringify(parsed);
}
