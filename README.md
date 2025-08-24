# GitHub Copilot Usage MCP Server
[![NPM](https://img.shields.io/npm/v/copilot-usage-mcp)](https://www.npmjs.com/package/copilot-usage-mcp)
[![License](https://img.shields.io/github/license/lucasliet/copilot-usage-mcp?logo=gitbook&labelColor=%23262c31&color=red&logoColor=white)](LICENSE)
[![tests](https://github.com/lucasliet/copilot-usage-mcp/actions/workflows/tests.yml/badge.svg)](https://github.com/lucasliet/copilot-usage-mcp/actions/workflows/tests.yml)


Um servidor MCP (Model Context Protocol) para obter informações de uso atual do GitHub Copilot, incluindo cotas, limites e estatísticas de uso.

## Instalação

### Via NPM
```bash
npx -y copilot-usage-mcp
```

### Instalação Local para Desenvolvimento
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd copilot-usage-mcp

# Instale as dependências
npm install

# Execute o servidor
npx -y -p "path_do_projeto" copilot-usage-mcp
```

## Como Obter o Token do Copilot

Para usar este MCP server, você precisa do token de acesso do GitHub Copilot. Existem algumas formas de obtê-lo:

### Método 1: Através do VS Code

1. Abra o VS Code com a extensão GitHub Copilot instalada
2. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
3. Digite "Developer: Open Webview Developer Tools"
4. Na aba Network, faça uma requisição que utilize o Copilot
5. Procure por requisições para `api.github.com/copilot_internal`
6. Copie o valor do header `Authorization` (remova o "token " do início)

### Método 2: Através de Ferramentas de Desenvolvimento

Você pode usar ferramentas como mitmproxy ou interceptar requisições do VS Code para capturar o token.

> [!WARNING]  
> **Importante**: o token obtido por esses métodos é temporário e expirará após algumas horas. Você precisará renová-lo periodicamente.

### Método 3 (Recomendado): Através do Arquivo de Configuração (Neovim, JetBrains, etc.)

As extensões oficiais do Copilot para várias IDEs (incluindo Neovim com `copilot.lua` e a suíte JetBrains) armazenam as informações de autenticação em um arquivo JSON local. Você pode extrair o token diretamente deste arquivo.

1.  **Localize e abra o arquivo**: O arquivo geralmente está localizado em `~/.config/github-copilot/apps.json`.

2.  **Encontre o token**: Dentro do arquivo JSON, procure por uma chave chamada `oauth_token`. O valor associado a essa chave é o seu token de acesso.

    Você pode usar o seguinte comando no terminal para extrair o token rapidamente (requer a ferramenta `jq`):

    ```bash
    cat ~/.config/github-copilot/apps.json | jq -r '.[].oauth_token'
    ```
> [!TIP]
> Esse token não é temporário e pode continuar sendo usado, para revoga-lo acesse: https://github.com/settings/apps/authorizations

## Uso com Agentes AI

### Configuração para Claude Code

```bash
claude mcp add --scope user copilot-usage --env COPILOT_TOKEN="seu_token_aqui" -- npx -y copilot-usage-mcp
```

### Configuração para Gemini CLI

```bash
gemini mcp add copilot-usage npx -y copilot-usage-mcp -e COPILOT_TOKEN="seu_token_aqui"
```

### Configuração para Claude Desktop / Cursor etc

Adicione ao seu arquivo de configuração do Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "copilot-usage": {
      "command": "npx",
      "args": ["-y", "copilot-usage-mcp"],
      "env": {
        "COPILOT_TOKEN": "seu_token_aqui"
      }
    }
  }
}
```

## Ferramentas Disponíveis

### `get_copilot_usage`

Obtém informações brutas de uso do GitHub Copilot em formato JSON.

### `get_copilot_usage_formatted`

Obtém informações de uso do GitHub Copilot formatadas de forma legível em português.

### `get_copilot_usage_summary`

Obtém um resumo conciso das informações principais de uso premium do GitHub Copilot.

## Exemplos de Uso no Agent

Depois de configurado, você pode usar o MCP server em conversas com seu agent AI:

```
"Verifique meu uso atual do GitHub Copilot"
```

```
"Quanto restam das minhas interações premium do Copilot?"
```

```
"Mostre meu status de cota do GitHub Copilot de forma detalhada"
```

## Estrutura do Projeto

```
copilot-usage-mcp/
├── index.js              # Ponto de entrada principal
├── package.json          # Dependências e configuração do NPM
├── package-lock.json     # Lockfile do NPM
├── README.md             # Este arquivo
├── LICENSE               # Licença MIT
├── .gitignore            # Arquivos ignorados pelo Git
├── src/                  # Código fonte principal
│   ├── server.js         # Servidor MCP principal
│   ├── api.js            # Lógica da API do GitHub Copilot
│   └── formatter.js      # Utilitários de formatação
└── test/                 # Testes
    ├── index.test.js
    ├── api.test.js
    ├── formatter.test.js
    ├── server.test.js
    └── mocks/
        ├── handlers.js
        └── server.js
```

## Dependências

- `@modelcontextprotocol/sdk`: SDK oficial do MCP

## Limitações e Considerações

⚠️ **Este servidor utiliza um endpoint interno não documentado do GitHub (`copilot_internal/user`)**

- **Não é uma API oficial**: O endpoint pode ser alterado ou removido sem aviso
- **Token temporário**: O token expira e precisa ser renovado periodicamente (a não ser o utilizado pelo nvim ou jetbrains)
- **Rate limiting**: Pode haver limites de taxa nas requisições
- **Termos de uso**: Use por sua conta e risco, considerando os termos de serviço do GitHub

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Disclaimer

Este projeto é não oficial e não está afiliado ao GitHub ou à Microsoft. Use por sua conta e risco.
