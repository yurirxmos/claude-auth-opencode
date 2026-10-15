import type { CredentialStore } from "../credentials/index.js";
export interface AnthropicProxyOptions {
    upstreamBaseURL?: string;
}
export interface AnthropicProxy {
    readonly url: string;
    close(): Promise<void>;
}
export declare function startAnthropicProxy(credentialStore: CredentialStore, options?: AnthropicProxyOptions): Promise<AnthropicProxy>;
