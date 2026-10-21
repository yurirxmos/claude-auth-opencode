import { randomUUID } from "node:crypto";
import {
	createServer,
	type IncomingMessage,
	type Server,
	type ServerResponse,
} from "node:http";

import type { CredentialStore } from "../credentials/index.js";
import { CLAUDE_CREDENTIALS_EXPIRED_MESSAGE } from "../auth.js";
import {
	LONG_CONTEXT_BETAS,
	buildClaudeCodeHeaders,
	transformClaudeCodeBody,
} from "../protocol/claudeCode.js";

const ANTHROPIC_UPSTREAM =
	process.env.ANTHROPIC_UPSTREAM_URL ?? "https://api.anthropic.com";

export interface AnthropicProxyOptions {
	upstreamBaseURL?: string;
}

export interface AnthropicProxy {
	readonly url: string;
	close(): Promise<void>;
}

function readRequestBody(request: IncomingMessage): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		request.on("data", (chunk: Buffer) => chunks.push(chunk));
		request.on("end", () => resolve(Buffer.concat(chunks)));
		request.on("error", reject);
	});
}

function isJsonContentType(value: string | undefined): boolean {
	return (
		typeof value === "string" &&
		value.toLowerCase().includes("application/json")
	);
}

function buildUpstreamUrl(requestUrl: string, upstreamBaseURL: string): string {
	const base = upstreamBaseURL.replace(/\/+$/, "");
	const incoming = new URL(requestUrl, "http://127.0.0.1");
	if (
		incoming.pathname === "/v1/messages" &&
		!incoming.searchParams.has("beta")
	) {
		incoming.searchParams.set("beta", "true");
	}
	return `${base}${incoming.pathname}${incoming.search}`;
}

function buildForwardHeaders(
	request: IncomingMessage,
	sessionID: string,
	accessToken: string,
	excludeBetas: ReadonlySet<string>,
): Record<string, string> {
	const headers: Record<string, string> = {};
	for (const [key, value] of Object.entries(request.headers)) {
		if (typeof value !== "string") continue;
		const lower = key.toLowerCase();
		if (
			lower === "host" ||
			lower === "content-length" ||
			lower === "authorization" ||
			lower === "x-api-key"
		)
			continue;
		headers[key] = value;
	}

	Object.assign(
		headers,
		buildClaudeCodeHeaders({
			accessToken,
			sessionID,
			incomingBetas:
				typeof request.headers["anthropic-beta"] === "string"
					? request.headers["anthropic-beta"]
					: null,
			excludeBetas,
		}),
	);

	return headers;
}

function isLongContextBetaError(body: string): boolean {
	return (
		body.includes("long context beta is not yet available") ||
		body.includes("Extra usage is required for long context requests")
	);
}

function sendAuthenticationError(response: ServerResponse): void {
	response.writeHead(401, { "content-type": "application/json" });
	response.end(
		JSON.stringify({
			type: "error",
			error: {
				type: "authentication_error",
				message: CLAUDE_CREDENTIALS_EXPIRED_MESSAGE,
			},
		}),
	);
}

export async function startAnthropicProxy(
	credentialStore: CredentialStore,
	options: AnthropicProxyOptions = {},
): Promise<AnthropicProxy> {
	const sessionID = randomUUID();
	const upstreamBaseURL = options.upstreamBaseURL ?? ANTHROPIC_UPSTREAM;
	const excludedBetas = new Set<string>();

	const server: Server = createServer(
		async (request: IncomingMessage, response: ServerResponse) => {
			try {
				const credentials = await credentialStore.getValidCredentials();
				if (!credentials) {
					sendAuthenticationError(response);
					return;
				}

				const rawBody = await readRequestBody(request);
				let body = rawBody.length > 0 ? rawBody.toString("utf8") : undefined;
				if (
					body !== undefined &&
					isJsonContentType(request.headers["content-type"])
				) {
					body = transformClaudeCodeBody(body);
				}

				const url = buildUpstreamUrl(request.url ?? "/", upstreamBaseURL);
				const send = (): Promise<Response> =>
					fetch(url, {
						method: request.method,
						headers: buildForwardHeaders(
							request,
							sessionID,
							credentials.accessToken,
							excludedBetas,
						),
						body: body === undefined ? undefined : body,
						redirect: "manual",
					});

				let upstream = await send();
				let bufferedBody: string | undefined;

				if (upstream.status === 401) {
					// The access token can be revoked before its local expiration. Do
					// not keep serving it from the cache after Anthropic rejects it.
					credentialStore.clear();
					await upstream.text();
					sendAuthenticationError(response);
					return;
				}

				if (upstream.status === 400) {
					bufferedBody = await upstream.text();
					if (isLongContextBetaError(bufferedBody)) {
						// Retry once without the betas this subscription rejects.
						for (const beta of LONG_CONTEXT_BETAS) excludedBetas.add(beta);
						bufferedBody = undefined;
						upstream = await send();
					}
				}

				const responseHeaders: Record<string, string> = {};
				upstream.headers.forEach((value, key) => {
					if (
						key.toLowerCase() === "content-encoding" ||
						key.toLowerCase() === "content-length"
					)
						return;
					responseHeaders[key] = value;
				});

				response.writeHead(upstream.status, responseHeaders);
				if (bufferedBody !== undefined) {
					response.end(bufferedBody);
					return;
				}
				if (upstream.body) {
					for await (const chunk of upstream.body) {
						response.write(chunk);
					}
				}
				response.end();
			} catch (error) {
				if (!response.headersSent) {
					response.writeHead(502, { "content-type": "application/json" });
				}
				response.end(
					JSON.stringify({
						type: "error",
						error: {
							type: "api_error",
							message:
								error instanceof Error
									? error.message
									: "Claude auth proxy failed",
						},
					}),
				);
			}
		},
	);

	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	if (address === null || typeof address === "string") {
		throw new Error("Claude auth proxy did not bind to a TCP port");
	}

	return {
		url: `http://127.0.0.1:${address.port}`,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			}),
	};
}
