# claude-auth-opencode

🇺🇸 English · [🇧🇷 Português](https://github.com/yurirxmos/claude-auth-opencode/blob/main/README.pt-BR.md)

OpenCode V2 plugin that uses your Claude Code session to access Anthropic models, without a separate API key.

> Unofficial workaround. Anthropic may restrict the use of Pro/Max subscription tokens outside official clients. Use at your own risk.

## How to use

1. Install and log in to Claude Code (`claude`).
2. Install the plugin (see below).
3. Pick an Anthropic model in OpenCode, for example `anthropic/claude-sonnet-4-5`.

Check your credentials at any time:

```bash
npx claude-auth-opencode doctor
```

When the token expires, run `claude` again to renew it.

## Installation

```bash
opencode plugin add claude-auth-opencode
opencode service restart
```

### Development

To test from source, clone the repository, build it, and point the plugin to the local path in `~/.config/opencode/opencode.json`:

```bash
git clone https://github.com/yurirxmos/claude-auth-opencode
cd claude-auth-opencode
bun install && bun run build
```

```jsonc
{
  "plugins": ["/absolute/path/to/claude-auth-opencode"]
}
```

After changing the code, run `bun run build` and restart the service with `opencode service restart`.

```bash
bun run check   # typecheck
bun run test    # tests
bun run build   # generates dist/ (committed to the repository)
```

## License

MIT
