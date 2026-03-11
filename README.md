# MCP-Claude

Personal MCP (Model Context Protocol) server setup for Claude Code CLI. Integrates Google Gemini and a local Qwen2.5-Coder model to offload tasks from Claude, reducing token usage while keeping Claude focused on orchestration and complex reasoning.

---

## Servers

### Gemini (`gemini/`)
Connects to Google Gemini via API.

| Tool | Model | Use for |
|------|-------|---------|
| `ask_gemini` | Gemini Flash | Analysis, docs, synthesis, medium tasks |
| `ask_gemini_pro` | Gemini Pro | Architecture, complex reasoning, critical code |
| `web_search` | Gemini + Google Search | Real-time web search with grounding |
| `web_reader` | Gemini | Fetch and parse content from a URL |
| `parse_document` | Gemini | Extract text from PDFs and images |

### Qwen (`qwen/`)
Runs `qwen2.5-coder:14b` locally via Ollama. Free, private, GPU-accelerated.

| Tool | Use for |
|------|---------|
| `ask_qwen` | Boilerplate, completing functions, tests, simple scripts (<100 lines) |

---

## Delegation hierarchy

| Task | Model |
|------|-------|
| Boilerplate, functions, tests (<100 lines) | `ask_qwen` (local GPU, free) |
| Analysis, docs, synthesis, medium tasks | `ask_gemini` |
| Architecture, complex reasoning, critical code | `ask_gemini_pro` |
| Orchestration, file I/O, short responses | Claude |

**Rule:** Always prefer `ask_qwen` for routine code — it runs locally and costs zero tokens.

**Sub-agent rule:** When tasks have independent parts, spawn parallel sub-agents — each must use the external tools above, not Claude's own generation. Any sub-agent generating >50 lines or >300 words without delegating is violating this rule.

---

## Requirements

- Node.js 18+
- npm
- Google Gemini API key (free tier works)
- For Qwen local: Ollama (installed automatically by `setup.sh`)
- GPU recommended (AMD/NVIDIA/Apple Silicon) — also works on CPU

---

## Installation

```bash
git clone https://github.com/sheartnet/MCP-Claude.git ~/Claude-mcp
bash ~/Claude-mcp/setup.sh
```

The script does:
1. `npm install` in each server directory
2. Asks for your Google API key and writes `~/.claude/settings.json`
3. Installs Ollama
4. Creates a systemd user service for Ollama (with `OLLAMA_VULKAN=1` for AMD RDNA 4 GPUs)
5. Downloads `qwen2.5-coder:14b` (~9GB)
6. Verifies both MCP servers respond correctly

Then restart Claude Code — `ask_qwen` and `ask_gemini` will be available as tools.

---

## Manual configuration

Add this to `~/.claude/settings.json` (replace paths and API key):

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/home/YOUR_USER/Claude-mcp/gemini/index.js"],
      "env": {
        "GOOGLE_API_KEY": "YOUR_API_KEY_HERE"
      }
    },
    "qwen": {
      "command": "node",
      "args": ["/home/YOUR_USER/Claude-mcp/qwen/index.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434/v1",
        "QWEN_MODEL": "qwen2.5-coder:14b"
      }
    }
  }
}
```

---

## AMD RDNA 4 note (RX 9070 / 9070 XT)

RDNA 4 (gfx1201) lacks full ROCm support. Ollama must use Vulkan:

```bash
OLLAMA_VULKAN=1 ollama serve
```

The `setup.sh` script creates a systemd service that sets this automatically.

---

## Restore after format

```bash
git clone https://github.com/sheartnet/MCP-Claude.git ~/Claude-mcp
bash ~/Claude-mcp/setup.sh
```

For a guided restore using Claude Code, see [RESTORE_PROMPT.md](RESTORE_PROMPT.md).
