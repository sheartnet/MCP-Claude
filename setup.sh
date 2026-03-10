#!/usr/bin/env bash
# ============================================================
# setup.sh — Restauración completa de MCP servers + Ollama/Qwen
# Uso: bash setup.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS_FILE="$HOME/.claude/settings.json"
SYSTEMD_DIR="$HOME/.config/systemd/user"
QWEN_MODEL="qwen2.5-coder:14b"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!!]${NC} $1"; }
error() { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

echo ""
echo "================================================"
echo "  Setup MCP servers + Ollama/Qwen"
echo "================================================"
echo ""

# ── 1. Dependencias ──────────────────────────────────────────
echo ">>> Paso 1: Verificando dependencias..."

if ! command -v node &>/dev/null; then
    error "Node.js no encontrado. Instálalo primero: https://nodejs.org"
fi
info "Node.js $(node --version)"

if ! command -v npm &>/dev/null; then
    error "npm no encontrado."
fi
info "npm $(npm --version)"

# ── 2. npm install en cada servidor ──────────────────────────
echo ""
echo ">>> Paso 2: Instalando dependencias de MCP servers..."

for srv in gemini qwen; do
    if [ -d "$SCRIPT_DIR/$srv" ]; then
        echo "  → $srv/"
        cd "$SCRIPT_DIR/$srv" && npm install --silent
        cd "$SCRIPT_DIR"
        info "$srv listo"
    else
        warn "Carpeta $srv/ no encontrada, saltando"
    fi
done

# ── 3. API key de Gemini ──────────────────────────────────────
echo ""
echo ">>> Paso 3: Configuración de API keys"
echo ""

read -rp "  Google API Key (Gemini): " GOOGLE_API_KEY
if [ -z "$GOOGLE_API_KEY" ]; then
    warn "Sin API key de Gemini — el servidor gemini no funcionará"
fi

# ── 4. settings.json ─────────────────────────────────────────
echo ""
echo ">>> Paso 4: Configurando ~/.claude/settings.json..."

mkdir -p "$HOME/.claude"

cat > "$SETTINGS_FILE" << EOF
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["$SCRIPT_DIR/gemini/index.js"],
      "env": {
        "GOOGLE_API_KEY": "$GOOGLE_API_KEY"
      }
    },
    "qwen": {
      "command": "node",
      "args": ["$SCRIPT_DIR/qwen/index.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434/v1",
        "QWEN_MODEL": "$QWEN_MODEL"
      }
    }
  }
}
EOF
info "settings.json creado en $SETTINGS_FILE"

# ── 5. Instalar Ollama ────────────────────────────────────────
echo ""
echo ">>> Paso 5: Instalando Ollama..."

if command -v ollama &>/dev/null; then
    info "Ollama ya instalado: $(ollama --version 2>/dev/null || echo 'versión desconocida')"
else
    echo "  Descargando e instalando Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    info "Ollama instalado"
fi

# ── 6. Servicio systemd con Vulkan ────────────────────────────
echo ""
echo ">>> Paso 6: Configurando servicio systemd (Vulkan AMD)..."

mkdir -p "$SYSTEMD_DIR"
cat > "$SYSTEMD_DIR/ollama.service" << 'SVCEOF'
[Unit]
Description=Ollama Service (Vulkan AMD)
After=network.target

[Service]
Type=simple
Environment=OLLAMA_VULKAN=1
ExecStart=/usr/local/bin/ollama serve
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
SVCEOF

systemctl --user daemon-reload
systemctl --user enable ollama.service
systemctl --user start ollama.service || warn "No se pudo iniciar el servicio ahora (normal en algunos entornos)"
info "Servicio ollama.service habilitado"

# ── 7. Descargar modelo Qwen ──────────────────────────────────
echo ""
echo ">>> Paso 7: Descargando modelo $QWEN_MODEL (~9GB)..."

# Esperar a que Ollama esté listo
for i in {1..10}; do
    if curl -s http://localhost:11434/api/tags &>/dev/null; then break; fi
    sleep 2
done

if ! curl -s http://localhost:11434/api/tags &>/dev/null; then
    warn "Ollama no responde. Iniciando manualmente..."
    OLLAMA_VULKAN=1 ollama serve &>/tmp/ollama_setup.log &
    sleep 5
fi

ollama pull "$QWEN_MODEL"
info "Modelo $QWEN_MODEL descargado"

# ── 8. Test final ─────────────────────────────────────────────
echo ""
echo ">>> Paso 8: Verificación final..."

# Test MCP qwen
if echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | timeout 5 node "$SCRIPT_DIR/qwen/index.js" 2>/dev/null | grep -q "ask_qwen"; then
    info "Servidor MCP qwen: OK"
else
    warn "Servidor MCP qwen no respondió — revisa node y dependencias"
fi

# Test MCP gemini
if [ -n "$GOOGLE_API_KEY" ]; then
    if echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | timeout 5 node "$SCRIPT_DIR/gemini/index.js" 2>/dev/null | grep -q "ask_gemini"; then
        info "Servidor MCP gemini: OK"
    else
        warn "Servidor MCP gemini no respondió"
    fi
fi

echo ""
echo "================================================"
echo "  Setup completo."
echo ""
echo "  Siguiente paso: reinicia Claude Code para"
echo "  que cargue los nuevos MCP servers."
echo "================================================"
echo ""
