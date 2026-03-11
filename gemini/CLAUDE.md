# gemini/CLAUDE.md — Servidor MCP Gemini

## Propósito

Proporciona herramientas Gemini Flash, Gemini Pro, búsqueda web, lectura de URLs y extracción de documentos a Claude Code.
Forma parte de la jerarquía de tres modelos definida en el `CLAUDE.md` raíz:

```
ask_qwen (local, gratis) → ask_gemini (medio) → ask_gemini_pro (complejo)
```

Este servidor cubre los niveles medio y alto. Para código rutinario <100 líneas usar siempre `ask_qwen` primero.

---

## Modelos disponibles

| Tool | Model ID | max_tokens default | Mejor para |
|------|-----------|--------------------|------------|
| `ask_gemini` | `gemini-3-flash-preview` | 8192 | Análisis, docs, síntesis, tareas web, texto medio |
| `ask_gemini_pro` | `gemini-3-pro-preview` | 16384 | Código complejo >100 líneas, arquitectura, razonamiento profundo |

---

## Routing dentro de Gemini

- Análisis, resúmenes, documentación, síntesis → `ask_gemini` (Flash)
- Código >100 líneas, algoritmos complejos, arquitectura → `ask_gemini_pro`
- Si Flash da resultado superficial tras 1 reintento → escalar a Pro
- Rate limit en Pro → fallback a Flash con task simplificado
- Web search y lectura de URLs → siempre `web_search` / `web_reader` (requieren API nativa)

---

## Template de sub-agente (incluir literalmente al hacer spawn)

```
Eres un sub-agente con acceso a: ask_qwen, ask_gemini, ask_gemini_pro,
web_search, web_reader, parse_document.

Reglas obligatorias:
- Código rutinario <100 líneas            → ask_qwen
- Análisis o texto >300 palabras          → ask_gemini
- Código complejo >100 líneas/arquitectura → ask_gemini_pro
- NUNCA generes bloques grandes tú mismo — delega a las herramientas
- Escribe el output a disco con Write o Edit
- Devuelve: { status, archivo_output, hallazgos_clave }
```

---

## Referencia de herramientas

| Tool | Params clave | Notas |
|------|-------------|-------|
| `ask_gemini` | `prompt` (req), `system_prompt`, `temperature` (def 0.3), `max_tokens` (def 8192) | Flash — análisis y tareas medias |
| `ask_gemini_pro` | `prompt` (req), `system_prompt`, `temperature` (def 0.2), `max_tokens` (def 16384) | Pro — código complejo y arquitectura |
| `web_search` | `query` (req), `count` (def 10, max 50) | API nativa — grounding real con Google Search |
| `web_reader` | `url` (req), `prompt` (opcional) | API nativa — extrae contenido con url_context |
| `parse_document` | `source` (req: URL o base64), `prompt` (opcional), `mime_type` | Multimodal — PDFs e imágenes |

---

## Arquitectura de comunicación

El servidor usa dos rutas según la herramienta:

**Ruta SDK OpenAI** → `ask_gemini`, `ask_gemini_pro`, `parse_document`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/openai/`

**Ruta API nativa Gemini** → `web_search`, `web_reader`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/`
- **Necesaria** para `google_search` grounding y `url_context` — el SDK OpenAI no puede acceder a estas capacidades

La separación es transparente para Claude: llamas a la tool y el servidor gestiona la ruta correcta internamente.

---

## Consumo esperado

| Escenario | Sin delegación | Con delegación | Reducción |
|-----------|---------------|----------------|-----------|
| Investigación (10 fuentes) | ~18.000 tokens Claude | ~800 tokens Claude | 96% |
| Código complejo (>100 líneas) | ~5.000 tokens Claude | ~300 tokens Claude | 94% |

---

## Troubleshooting

**Herramientas no aparecen en Claude:**
- Verificar `~/.claude.json` → `mcpServers.gemini` tiene el path correcto
- Reiniciar Claude Code
- `node --version` para confirmar Node.js en PATH

**Rate limits (tier gratuito):**
- Flash: 15 RPM — si se alcanza, esperar 60s
- Pro: 5 RPM — fallback a Flash con task simplificado

**Respuesta vacía o error 400:**
- Verificar que `GOOGLE_API_KEY` está en `~/.claude.json` → `mcpServers.gemini.env`
- Comprobar que la key no expiró en [aistudio.google.com](https://aistudio.google.com)

**`web_search` no devuelve resultados:**
- Requiere ruta API nativa, no funciona con endpoints OpenAI-compatible
- Verificar model ID: `gemini-3-flash-preview` (no alias alternativos)

**`parse_document` falla en PDF grande:**
- Dividir en secciones y llamar varias veces
- Usar `prompt` para indicar qué extraer específicamente
