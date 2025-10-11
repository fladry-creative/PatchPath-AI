# Docker MCP Gateway Setup

Successfully configured Docker MCP Gateway in this GitHub Codespace!

## What's Installed

- **Docker MCP Gateway**: Open-source tool for managing 200+ containerized MCP servers
- **Total Available Servers**: 223 servers in the catalog
- **Currently Enabled Servers**:
  - `github-official` - GitHub integration
  - `dockerhub` - Docker Hub access
  - `playwright` - Browser automation
  - `brave` - Web search via Brave API

## Architecture

```
Claude Code <-> Docker MCP Gateway <-> 223+ Containerized MCP Servers
```

The gateway runs as a CLI plugin and manages containerized MCP servers, providing:

- Isolated execution environments
- Standardized server management
- Cross-platform compatibility
- Secure credential management

## Configuration

MCP Gateway is configured in [/home/node/.vscode-remote/data/Machine/settings.json](/home/node/.vscode-remote/data/Machine/settings.json):

```json
{
  "mcpServers": {
    "docker-mcp-gateway": {
      "type": "stdio",
      "command": "docker",
      "args": ["mcp", "gateway", "run", "--transport", "stdio"]
    }
  }
}
```

## Managing Servers

### View Available Servers

```bash
cat ~/.docker/mcp/catalogs/docker-mcp.yaml | grep -E "^  [a-z]" | head -50
```

### Enable More Servers

```bash
docker mcp server enable <server-name>
```

Examples:

```bash
docker mcp server enable github-official
docker mcp server enable mongodb
docker mcp server enable aws-core-mcp-server
docker mcp server enable elasticsearch
```

### List Enabled Servers

```bash
docker mcp server ls
```

### Disable Servers

```bash
docker mcp server disable <server-name>
```

## Available Server Categories

The catalog includes servers for:

- **DevOps**: AWS, Azure, Kubernetes, Terraform, CircleCI, GitHub Actions
- **Databases**: MongoDB, PostgreSQL, Elasticsearch, Couchbase, ClickHouse
- **Search**: Brave Search, Perplexity
- **Testing**: Playwright, Selenium
- **APIs**: GitHub, Stripe, Notion, Airtable
- **AI/ML**: Various AI service integrations
- **Documentation**: AWS Docs, Cloudflare Docs, Astro Docs
- And many more!

## Sample Popular Servers

- `github-official` - GitHub API integration
- `brave` - Web search
- `playwright` - Browser automation
- `mongodb` - MongoDB database
- `aws-core-mcp-server` - AWS services
- `elasticsearch` - Elasticsearch search
- `notion` - Notion workspace
- `stripe` - Stripe payments
- `dockerhub` - Docker Hub registry
- `perplexity-ask` - Perplexity AI search

## Gateway Commands

```bash
# Initialize catalog
docker mcp catalog init

# List catalogs
docker mcp catalog ls

# Run gateway
docker mcp gateway run --transport stdio

# Enable all servers (careful!)
docker mcp gateway run --enable-all-servers

# Run with specific servers only
docker mcp gateway run --servers github-official,brave,playwright
```

## Troubleshooting

### Check Gateway Status

```bash
cat /tmp/mcp-gateway.log
```

### View Server Configuration

```bash
ls -la ~/.docker/mcp/
cat ~/.docker/mcp/registry.yaml
```

### Test Docker

```bash
docker ps
docker version
```

## Next Steps

1. **Restart Claude Code** to load the MCP configuration
2. **Enable additional servers** based on your needs
3. **Configure API keys** for services that require authentication
4. **Test the connection** by asking Claude to use MCP tools

## Resources

- [Docker MCP Gateway GitHub](https://github.com/docker/mcp-gateway)
- [Docker MCP Documentation](https://docs.docker.com/ai/mcp-gateway/)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)
