import { Plugin } from "@opencode/plugin";
import { createDefaultCredentialStore } from "./credentials/index.js";
import { startAnthropicProxy } from "./proxy/server.js";
const credentialStore = createDefaultCredentialStore();
const plugin = Plugin.define({
    id: "claude-auth-opencode",
    async setup(context) {
        const proxy = await startAnthropicProxy(credentialStore);
        await context.provider.transform((editor) => {
            editor.update("anthropic", (provider) => {
                provider.activation = "enabled";
                provider.settings = {
                    ...provider.settings,
                    // The proxy replaces this placeholder with the real Claude Code
                    // OAuth token. It exists only to satisfy provider credential
                    // validation before the request leaves OpenCode.
                    authToken: "claude-code-oauth",
                    baseURL: `${proxy.url}/v1`,
                };
            });
        });
        return async () => {
            await proxy.close();
        };
    },
});
export default plugin;
export { createDefaultCredentialStore } from "./credentials/index.js";
