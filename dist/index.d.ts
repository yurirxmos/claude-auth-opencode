import { Plugin } from "@opencode/plugin";
declare const plugin: Plugin.Plugin;
export default plugin;
export { createDefaultCredentialStore } from "./credentials/index.js";
export type { ClaudeCredentials, CredentialSource, } from "./credentials/index.js";
