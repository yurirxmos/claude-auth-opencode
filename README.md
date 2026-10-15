# claude-auth-opencode

Plugin para **OpenCode V2** que autentica o provider `anthropic` com a sessão OAuth já existente do Claude Code — sem API key separada.

> **Atenção:** tokens de assinaturas Claude Pro/Max podem ter restrições de uso impostas pela Anthropic. Este projeto é um workaround de comunidade e pode parar de funcionar se o fluxo OAuth mudar. A alternativa oficialmente suportada é conectar o provider Anthropic com uma API key via `/connect`. Use por sua conta e risco.

## Início rápido

```bash
npx claude-auth-opencode doctor          # verifica as credenciais do Claude Code
opencode plugin add claude-auth-opencode # instala o plugin
opencode service restart
```

Depois use qualquer modelo Anthropic, por exemplo `anthropic/claude-sonnet-4-5`.

## Como funciona

O provider nativo `anthropic` do OpenCode exige `x-api-key` e valida isso antes de qualquer hook HTTP, então um plugin de hooks não consegue trocar a autenticação. Por isso o plugin:

1. **Lê as credenciais** do Claude Code:
   - macOS: Keychain (`Claude Code-credentials`), com fallback para o arquivo;
   - Linux/Windows: `~/.claude/.credentials.json` ou `$CLAUDE_CONFIG_DIR/.credentials.json`.
2. **Sobe um proxy local** em `127.0.0.1` (porta efêmera) e aponta `providers.anthropic.settings.baseURL` para ele.
3. O proxy **reassina cada requisição** no formato do Claude Code 2.1.300:
   - `Authorization: Bearer <token OAuth>`, sempre o token real, lido em memória;
   - betas do Claude Code em `anthropic-beta`, `anthropic-version`, `x-app`, `user-agent`, `x-claude-code-session-id` e headers `x-stainless-*`;
   - `x-anthropic-billing-header` e a identidade do Claude Code em `system[0]`/`system[1]`;
   - o system prompt do OpenCode é movido para a primeira mensagem do usuário, porque a Anthropic rejeita prompts de terceiros em `system[]` com OAuth;
   - se a assinatura recusar a beta de contexto longo, a requisição é repetida uma vez sem ela.
4. Encaminha para `https://api.anthropic.com` e devolve o stream (SSE incluído).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npx claude-auth-opencode doctor` | Mostra se há credenciais válidas, a data de expiração e os passos de instalação. Nunca imprime o token. |

## Requisitos

- OpenCode V2.
- Claude Code instalado e autenticado (`claude`).
- Sessão ainda válida. O plugin não renova o token: quando ele expirar, rode `claude` para renová-lo. `npx claude-auth-opencode doctor` mostra a data de expiração.

## Instalação

### Pelo npm

```bash
opencode plugin add claude-auth-opencode
opencode service restart
```

### Pelo diretório local (desenvolvimento)

Aponte `plugins` em `~/.config/opencode/opencode.json` para a raiz do repositório:

```jsonc
{
  "plugins": ["/caminho/absoluto/para/claude-auth-opencode"]
}
```

O `dist/` vem versionado para que a instalação pelo Git funcione sem compilar. Ao alterar o código, rode `bun run build` e commite o `dist/` junto.

Se você usava `opencode-claude-auth@latest`, remova-o: ele é incompatível com o OpenCode V2.

## Desenvolvimento

```bash
bun install
bun run check   # typecheck
bun run test    # testes unitários
bun run build   # limpa e gera dist/
```

### Teste de integração real

Use diretórios temporários para não tocar na sua configuração nem no banco:

```bash
TMP=$(mktemp -d)
mkdir -p "$TMP/config/opencode"
printf '%s\n' '{"plugins":["/caminho/para/claude-auth-opencode"],"model":"anthropic/claude-sonnet-4-5"}' \
  > "$TMP/config/opencode/opencode.json"

cd /tmp && XDG_CONFIG_HOME="$TMP/config" XDG_DATA_HOME="$TMP/data" \
  opencode run --standalone --auto --model anthropic/claude-sonnet-4-5 \
  'Reply with exactly: AUTH_PLUGIN_OK'
```

## Limitações

- Não renova o token OAuth; quando expira, rode `claude`.
- Não traduz nomes de ferramentas com prefixo `mcp_` nem repara pares `tool_use`/`tool_result`.
- Betas e `cc_version` acompanham o Claude Code 2.1.300; precisam de revisão quando o CLI mudar.
- Usa a conta ativa do Claude Code; ainda não há seleção entre múltiplas contas.

## Segurança

- O token existe só em memória e no header enviado à Anthropic.
- O proxy escuta apenas em `127.0.0.1`, em porta efêmera.
- Nenhum token ou header de autorização é registrado em log.

## Licença

MIT
