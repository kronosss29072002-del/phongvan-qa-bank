# MCP Integration

Model Context Protocol (MCP) integration for connecting Claude Code to external tools and services.

## What is MCP?

Model Context Protocol enables Claude Code to:
- Connect to external tools and services
- Access resources (files, databases, APIs)
- Use custom tools
- Provide prompts and completions

## Configuration

MCP servers are configured in `.mcp.json`:

### Basic Configuration
```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "env": {
        "VAR_NAME": "value"
      }
    }
  }
}
```

### Example Configuration
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"],
      "env": {}
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/db"
      }
    }
  }
}
```

## Common MCP Servers

### Filesystem Access
```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/path/to/allowed/files"
    ]
  }
}
```

**Capabilities:**
- Read/write files
- List directories
- File search
- Path restrictions for security

### GitHub Integration
Remote hosted endpoint (GitHub's own MCP server — no local supply chain):
```json
{
  "github": {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```

Read-only mode (quét security/review): thêm header `X-MCP-Readonly: true`
hoặc giá trị `GITHUB_PERSONAL_ACCESS_TOKEN` rỗng.

**Capabilities:**
- Repository access
- Issues and PRs
- Code search
- Workflow management

### PostgreSQL Database
```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "DATABASE_URL": "${DATABASE_URL}"
    }
  }
}
```

**Capabilities:**
- Query execution
- Schema inspection
- Transaction management
- Connection pooling

### Brave Search
```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "${BRAVE_API_KEY}"
    }
  }
}
```

**Capabilities:**
- Web search
- News search
- Local search
- Result filtering

### Puppeteer (Browser Automation)
```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

**Capabilities:**
- Browser automation
- Screenshots
- PDF generation
- Web scraping

## Remote MCP Servers

Connect to MCP servers over HTTP/SSE:

### Basic Remote Server
```json
{
  "mcpServers": {
    "remote-service": {
      "url": "https://api.example.com/mcp"
    }
  }
}
```

### With Authentication
```json
{
  "mcpServers": {
    "remote-service": {
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}",
        "X-Custom-Header": "value"
      }
    }
  }
}
```

### With Proxy
```json
{
  "mcpServers": {
    "remote-service": {
      "url": "https://api.example.com/mcp",
      "proxy": "http://proxy.company.com:8080"
    }
  }
}
```

### Hosted multi-toolkit endpoint (Composio pattern)

Một số nhà cung cấp host sẵn nhiều toolkit sau một endpoint duy nhất, xác thực
bằng API key riêng thay vì tự chạy OAuth cho từng dịch vụ:

```json
{
  "mcpServers": {
    "composio": {
      "type": "http",
      "url": "https://backend.composio.dev/v3/mcp/${COMPOSIO_SERVER_ID}?user_id=${COMPOSIO_USER_ID}",
      "headers": { "x-api-key": "${COMPOSIO_API_KEY}" }
    }
  }
}
```

Cân nhắc trước khi dùng: (1) license proprietary — không OSI; (2) mọi lời gọi
toolkit đi qua server của nhà cung cấp, tức dữ liệu rời khỏi máy bạn; (3) mỗi
toolkit có scope riêng — review từng cái, đừng bật cả bộ.

## Environment Variables

Use environment variables for sensitive data:

### .env File
```bash
# .claude/.env
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx
DATABASE_URL=postgresql://user:pass@localhost/db
BRAVE_API_KEY=BSAxxxxx
API_TOKEN=token_xxxxx
```

### Reference in mcp.json
```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Testing MCP Servers

### Inspector Tool
```bash
npx @modelcontextprotocol/inspector
```

Opens web UI for testing MCP servers:
- List available tools
- Test tool invocations
- View resources
- Debug connections

### Manual Testing
```bash
# Test server command
npx -y @modelcontextprotocol/server-filesystem /tmp

# Check server output
echo '{"jsonrpc":"2.0","method":"initialize","params":{}}' | \
  npx -y @modelcontextprotocol/server-filesystem /tmp
```

## Creating Custom MCP Servers

### Python Server
```python
from mcp.server import Server
from mcp.server.stdio import stdio_server

server = Server("my-server")

@server.tool()
async def my_tool(arg: str) -> str:
    """Tool description"""
    return f"Result: {arg}"

if __name__ == "__main__":
    stdio_server(server)
```

### Configuration
```json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["path/to/server.py"]
    }
  }
}
```

### Node.js Server
```javascript
import { Server } from "@modelcontextprotocol/server-node";

const server = new Server("my-server");

server.tool({
  name: "my-tool",
  description: "Tool description",
  parameters: { arg: "string" }
}, async ({ arg }) => {
  return `Result: ${arg}`;
});

server.listen();
```

## Security Considerations

### Filesystem Access
- Restrict to specific directories
- Use read-only access when possible
- Validate file paths
- Monitor access logs

### API Credentials
- Use environment variables
- Never commit credentials
- Rotate keys regularly
- Implement least-privilege access

### Network Access
- Whitelist allowed domains
- Use HTTPS only
- Implement timeouts
- Rate limit requests

### Remote Servers
- Validate server certificates
- Use authentication
- Implement request signing
- Monitor for anomalies

## Troubleshooting

### Server Not Starting
```bash
# Check server command
npx -y @modelcontextprotocol/server-filesystem /tmp

# Verify environment variables
echo $GITHUB_PERSONAL_ACCESS_TOKEN

# Check logs
cat ~/.claude/logs/mcp-*.log
```

### Connection Errors
```bash
# Test network connectivity
curl https://api.example.com/mcp

# Verify proxy settings
echo $HTTP_PROXY

# Check firewall rules
```

### Permission Errors
```bash
# Verify file permissions
ls -la /path/to/allowed/files

# Check user permissions
whoami
groups
```

### Tool Not Found
- Verify server is running
- Check server configuration
- Inspect server capabilities
- Review tool registration

## Best Practices

### Configuration Management
- Use environment variables for secrets
- Document server purposes
- Version control mcp.json (without secrets)
- Test configurations thoroughly

### Performance
- Use local servers when possible
- Implement caching
- Set appropriate timeouts
- Monitor resource usage

### Maintenance
- Update servers regularly
- Monitor server health
- Review access logs
- Clean up unused servers

## See Also

- MCP specification: https://modelcontextprotocol.io
- Creating MCP servers: `references/api-reference.md`
- Security best practices: `references/best-practices.md`
- Troubleshooting: `references/troubleshooting.md`
