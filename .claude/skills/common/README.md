# Common Skill Utilities

This directory contains shared utilities used across multiple skills.

## Retry Engine (retry.sh)

Generic auto-retry wrapper for any long-running command. Survives transient
API errors (Cloudflare 524/502/503, ETIMEDOUT, ECONNRESET) with exponential
backoff. Use in ANY skill whose workflow can hit a network failure.

### Usage

```bash
# Retry a claude session
.claude/skills/common/retry.sh -- "claude --continue"

# Retry a build / test / script
.claude/skills/common/retry.sh --max-retries 15 --backoff 20 -- "npm run build"
.claude/skills/common/retry.sh -- "python3 scripts/long_job.py"

# Tuning via env (no CLI flags needed)
MAX_RETRIES=5 BACKOFF=10 retry.sh -- "./deploy.sh"
```

### Options

| Flag | Default | Meaning |
|------|---------|---------|
| `--max-retries N` | 10 | retry count |
| `--backoff S` | 20 | base backoff seconds (exponential ×1.5) |
| `--max-backoff S` | 300 | backoff cap (5 min) |
| `--dry-run` | off | validate without running |
| `--help` | - | usage |

### Detects (transient → retry)

- `524` / `origin_response_timeout` / `Proxy Read Timeout`
- `502` / `503` / `529` / bad gateway / service unavailable
- `ETIMEDOUT` / `ECONNRESET` / `ECONNREFUSED` / socket hang up
- `"retryable": true`

### Exit codes

- `0` success (or retries succeeded)
- `1` retries exhausted
- `N` non-transient failure (propagated)

### From a skill script

```bash
RETRY_ENGINE="$(dirname "$(readlink -f "$0")")/../../common/retry.sh"
exec "$RETRY_ENGINE" --max-retries 10 -- "claude --continue"
```

## API Key Helper

`api_key_helper.py` provides standardized configuration for all Gemini-based skills, supporting both Google AI Studio and Vertex AI endpoints.

### Usage in Skills

```python
import sys
from pathlib import Path

# Add common directory to path
common_dir = Path(__file__).parent.parent.parent / 'common'
sys.path.insert(0, str(common_dir))

from api_key_helper import get_api_key_or_exit

# Get API key with automatic error handling
api_key = get_api_key_or_exit()
```

### API Key Lookup Order

The helper checks for `GEMINI_API_KEY` in this order:

1. **Process environment variable** (recommended for development)
   ```bash
   export GEMINI_API_KEY='your-api-key'
   ```

2. **Project root `.env` file**
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .env
   ```

3. **.claude/.env file**
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .claude/.env
   ```

4. **.claude/skills/.env file** (shared across all Gemini skills)
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .claude/skills/.env
   ```

5. **Skill directory `.env` file**
   ```bash
   echo 'GEMINI_API_KEY=your-api-key' > .claude/skills/your-skill/.env
   ```

### Vertex AI Support

To use Vertex AI instead of Google AI Studio:

```bash
# Enable Vertex AI
export GEMINI_USE_VERTEX=true
export VERTEX_PROJECT_ID=your-gcp-project-id
export VERTEX_LOCATION=us-central1  # Optional, defaults to us-central1
```

Or in `.env` file:
```
GEMINI_USE_VERTEX=true
VERTEX_PROJECT_ID=your-gcp-project-id
VERTEX_LOCATION=us-central1
```

### Using get_client() Helper

For automatic client selection (AI Studio or Vertex AI):

```python
from api_key_helper import get_client

# Get appropriate client based on configuration
client_info = get_client()

if client_info['type'] == 'vertex':
    # Using Vertex AI
    from vertexai.generative_models import GenerativeModel
    model = GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Hello")
else:
    # Using AI Studio
    client = client_info['client']
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Hello"
    )
```

### Using get_vertex_config() Helper

For checking Vertex AI configuration:

```python
from api_key_helper import get_vertex_config

vertex_config = get_vertex_config()
if vertex_config['use_vertex']:
    print(f"Using Vertex AI")
    print(f"Project: {vertex_config['project_id']}")
    print(f"Location: {vertex_config['location']}")
```

### Error Handling

If the API key is not found, the helper will:
- Print a clear error message
- Show all available methods to set the API key
- Provide the URL to obtain an API key
- Exit with status code 1

For Vertex AI, if `VERTEX_PROJECT_ID` is missing when `GEMINI_USE_VERTEX=true`, the helper will provide clear instructions.

This ensures users get immediate, actionable feedback when configuration is missing.
