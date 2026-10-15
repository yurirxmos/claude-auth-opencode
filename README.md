# claude-auth-opencode

Plugin para o **OpenCode V2** que usa sua sessão do **Claude Code** para acessar modelos Anthropic, sem API key separada.

> Workaround não oficial. A Anthropic pode restringir o uso de tokens de assinatura Pro/Max fora dos clientes oficiais. Use por sua conta e risco.

## Como usar

1. Tenha o Claude Code instalado e logado (`claude`).
2. Instale o plugin (veja abaixo).
3. Escolha um modelo Anthropic no OpenCode, por exemplo `anthropic/claude-sonnet-4-5`.

Verifique suas credenciais a qualquer momento:

```bash
npx claude-auth-opencode doctor
```

Quando o token expirar, rode `claude` de novo para renová-lo.

## Instalação

```bash
opencode plugin add claude-auth-opencode
opencode service restart
```

Se você usava `opencode-claude-auth@latest`, remova-o: ele não funciona no OpenCode V2.

### Desenvolvimento

Para testar a partir do código-fonte, clone o repositório, compile e aponte o plugin para o caminho local em `~/.config/opencode/opencode.json`:

```bash
git clone https://github.com/yurirxmos/claude-auth-opencode
cd claude-auth-opencode
bun install && bun run build
```

```jsonc
{
  "plugins": ["/caminho/absoluto/para/claude-auth-opencode"]
}
```

Depois de alterar o código, rode `bun run build` e reinicie o serviço com `opencode service restart`.

```bash
bun run check   # typecheck
bun run test    # testes
bun run build   # gera dist/ (versionado no repositório)
```

## Licença

MIT
