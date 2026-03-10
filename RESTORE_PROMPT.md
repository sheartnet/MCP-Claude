# Prompt de restauración — para pegar a Claude Code tras un formateo

Copia y pega el bloque de abajo a Claude Code en una sesión nueva:

---

```
Necesito que me ayudes a restaurar mi entorno de desarrollo completo tras un formateo.
Aquí está la configuración que tenía y que quiero recuperar:

## MCP Servers (Claude Code)

Tengo un repositorio GitHub con mis servidores MCP: https://github.com/sheartnet/MCP-Claude

Clónalo en ~/Claude-mcp/ y ejecuta el script de setup:
  git clone https://github.com/sheartnet/MCP-Claude.git ~/Claude-mcp
  bash ~/Claude-mcp/setup.sh

El script hace todo automáticamente:
1. npm install en cada servidor (gemini, qwen)
2. Pide la Google API Key y crea ~/.claude/settings.json
3. Instala Ollama
4. Crea el servicio systemd con OLLAMA_VULKAN=1 (GPU AMD RX 9070 XT, gfx1201 RDNA 4)
5. Descarga qwen2.5-coder:14b
6. Verifica que todo funciona

## Mi hardware
- CPU: AMD Ryzen 7 9800X3D
- GPU: AMD Radeon RX 9070 XT (16GB VRAM, RDNA 4, gfx1201)
- RAM: 30GB

## Notas importantes
- Ollama SIEMPRE debe arrancar con OLLAMA_VULKAN=1 para usar la GPU
  (gfx1201 es RDNA 4, aún sin soporte ROCm completo, usa Vulkan)
- El servicio systemd ya incluye esa variable, está en ~/.config/systemd/user/ollama.service
- Si Ollama corre sin esa variable, usará CPU en vez de GPU

## Jerarquía de modelos que uso
- ask_qwen  → código rutinario, boilerplate (<100 líneas). Local, gratis, GPU.
- ask_gemini → análisis, docs, síntesis
- ask_gemini_pro → arquitectura, razonamiento complejo
- Claude   → orquestación, I/O archivos, respuestas cortas

## Si algo falla
- Ollama no detecta GPU: ejecutar `OLLAMA_VULKAN=1 ollama serve` manualmente
- MCP no carga: reiniciar Claude Code, verificar settings.json
- Modelo no descargado: `ollama pull qwen2.5-coder:14b`

Cuando termines confirma que ask_qwen y ask_gemini están disponibles como herramientas.
```

---

## ¿Qué subir a GitHub?

### Sí subir (ya en el repo):
- `gemini/index.js` — servidor MCP Gemini
- `gemini/package.json`
- `qwen/index.js` — servidor MCP Qwen (local)
- `qwen/package.json`
- `setup.sh` — script de restauración automática
- `RESTORE_PROMPT.md` — este archivo
- `.gitignore` (ya excluye node_modules, .env, API keys)

### NO subir (privado, nunca a GitHub):
- `~/.claude/settings.json` → contiene tu Google API Key
- `~/.ollama/` → modelos grandes (9GB+), se re-descargan con setup.sh
- `node_modules/` → ya en .gitignore, se regeneran con npm install

### Repo personal:
https://github.com/sheartnet/MCP-Claude
