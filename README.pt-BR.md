# claude-auth-opencode

[🇺🇸 English](https://github.com/yurirxmos/claude-auth-opencode/blob/main/README.md) · 🇧🇷 Português (pt-BR)

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

Quando o token expirar, o OpenCode mostrará uma instrução para rodar
`/claude-renew`. O comando abre o Claude Code para renovar a sessão. Na maioria
dos casos basta iniciá-lo: o Claude Code renova o token silenciosamente. Se a
sessão não puder ser renovada, ele solicitará login no navegador.

## Instalação

```bash
opencode plugin add claude-auth-opencode
opencode service restart
```

### Atualizações

Ao abrir o OpenCode, o plugin verifica se há uma versão nova, instala em segundo
plano e pergunta se pode reiniciar o serviço para aplicá-la. Para só receber o
aviso, sem instalação automática, desative em `~/.config/opencode/opencode.json`:

```jsonc
{
  "plugins": [
    { "package": "claude-auth-opencode", "options": { "autoUpdate": false } }
  ]
}
```

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
