import { Plugin } from "@opencode/plugin";
import { watch, type FSWatcher } from "node:fs";
import { basename, dirname } from "node:path";

import {
	createDefaultCredentialStore,
	getCredentialFilePath,
} from "./credentials/index.js";
import { startAnthropicProxy } from "./proxy/server.js";

const credentialStore = createDefaultCredentialStore();

function watchCredentialFile(): FSWatcher | undefined {
	const credentialPath = getCredentialFilePath();
	const credentialName = basename(credentialPath);

	try {
		return watch(dirname(credentialPath), (_event, changedPath) => {
			if (changedPath === null || changedPath.toString() === credentialName) {
				credentialStore.clear();
			}
		});
	} catch {
		// A file watcher is only an optimization. The credential store still
		// reloads credentials when its short-lived cache expires.
		return undefined;
	}
}

const plugin = Plugin.define({
	id: "claude-auth-opencode",
	async setup(context) {
		const proxy = await startAnthropicProxy(credentialStore);
		const credentialWatcher = watchCredentialFile();

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
			credentialWatcher?.close();
			await proxy.close();
		};
	},
});

export default plugin;
export { createDefaultCredentialStore } from "./credentials/index.js";
export type {
	ClaudeCredentials,
	CredentialSource,
} from "./credentials/index.js";
