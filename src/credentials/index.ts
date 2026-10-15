import { createFileCredentialSource } from "./file.js";
import { createMacOSKeychainCredentialSource } from "./keychain.js";
import { CredentialStore } from "./store.js";

export {
	createFileCredentialSource,
	getCredentialFilePath,
	parseCredentialsFile,
} from "./file.js";
export { createMacOSKeychainCredentialSource } from "./keychain.js";
export { CredentialStore } from "./store.js";
export type { ClaudeCredentials, CredentialSource } from "./types.js";

export function createDefaultCredentialStore(): CredentialStore {
	return new CredentialStore([
		createMacOSKeychainCredentialSource(),
		createFileCredentialSource(),
	]);
}
