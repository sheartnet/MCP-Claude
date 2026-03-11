# CLAUDE.md — Constitución de Orquestación MCP

## Stack de tres modelos

| Modelo | Tool | Usar para |
|--------|------|-----------|
| Qwen2.5-Coder 14B (GPU local, gratis) | `ask_qwen` | Boilerplate, funciones, tests, scripts <100 líneas |
| Gemini Flash | `ask_gemini` | Análisis, docs, síntesis, tareas web, tareas medias |
| Gemini Pro | `ask_gemini_pro` | Arquitectura, razonamiento complejo, código crítico >100 líneas |
| Claude | (sí mismo) | Orquestación, I/O archivos, respuestas <100 palabras |

**Regla principal:** PREFERIR `ask_qwen` para todo código rutinario — corre en GPU local y cuesta cero tokens.

---

## DELEGATION GATE — Ejecutar antes de generar cualquier contenido

### Prioridad 1 — Spawn Sub-Agentes Paralelos (PREFERIDO)

Si el task tiene N partes independientes → spawn N sub-agentes simultáneos.
Cada sub-agente DEBE usar un modelo externo para el trabajo pesado.

**Ejemplo — feature full-stack:**
```
Sub-agente A → backend API    → ask_gemini_pro → escribe a src/api.js
Sub-agente B → frontend       → ask_gemini_pro → escribe a src/App.jsx
Sub-agente C → tests unitarios → ask_qwen      → escribe a tests/
(todos en paralelo — Claude ensambla resultados al final)
```

### Prioridad 2 — Delegación Directa (task de una sola parte)

Un solo task no paralelizable → llamar directamente al modelo correcto según la tabla de routing.

### Prioridad 3 — Claude lo hace (ÚLTIMO RECURSO)

Solo cuando:
- Orquestando herramientas o sub-agentes
- I/O de disco (Read/Write/Edit/Bash)
- La respuesta es <100 palabras
- Polish/integración final de contenido ya delegado

> **VIOLACIÓN:** Cualquier sub-agente que genere >50 líneas de código o >300 palabras de análisis
> SIN llamar a un modelo externo está desperdiciando el presupuesto de tokens. Sin excepciones.

---

## Tabla de routing

| Tipo de task | Umbral | Usar |
|--------------|--------|------|
| Boilerplate, funciones, tests, scripts rutinarios | <100 líneas | `ask_qwen` |
| Código complejo, algoritmos, lógica crítica | >100 líneas o complejo | `ask_gemini_pro` |
| Análisis, síntesis, documentación, resúmenes | >300 palabras | `ask_gemini` |
| Arquitectura, diseño de sistemas | cualquiera | `ask_gemini_pro` |
| Búsqueda web, investigación | cualquiera | `web_search` + `ask_gemini` |
| Extracción de PDF o imágenes | cualquiera | `parse_document` |
| Refactor simple, completar funciones | <100 líneas | `ask_qwen` |
| Orquestación, I/O, respuestas cortas | — | Claude |

---

## Template de instrucción para sub-agentes

Incluir literalmente al spawn de sub-agentes Task:

```
Eres un sub-agente con acceso a: ask_qwen, ask_gemini, ask_gemini_pro,
web_search, web_reader, parse_document.

Reglas obligatorias:
- Código rutinario <100 líneas            → ask_qwen
- Análisis o texto >300 palabras          → ask_gemini
- Código complejo >100 líneas/arquitectura → ask_gemini_pro
- NUNCA generes bloques grandes tú mismo — delega a las herramientas
- Escribe el output a disco con Write o Edit
- Devuelve al finalizar: { status, archivo_output, hallazgos_clave }
```

---

## Patrones comunes

### Pattern 1 — Investigación y síntesis
```
web_search(query, count=20)                        # buscar fuentes
[web_reader(url1), web_reader(url2), ...]          # extracción paralela
ask_gemini("Sintetiza los siguientes contenidos: [...]")  # síntesis
Write(ruta, resultado)                             # Claude escribe a disco
```

### Pattern 2 — Generación de código
```
# Rutinario (<100 líneas):
ask_qwen("Escribe fixtures de pytest para UserService")
Write(ruta, código)

# Complejo (>100 líneas o arquitectura):
ask_gemini_pro("Implementa flujo OAuth2 con refresh tokens")
Write(ruta, código)
```

### Pattern 3 — Pipeline de documentos
```
parse_document(url_pdf)                            # extraer texto
ask_gemini("Extrae obligaciones y riesgos: [texto]")  # analizar
Write(ruta, análisis)
```

### Pattern 4 — Sub-agentes paralelos (multi-parte)
```
Task("Backend: usa ask_gemini_pro → escribe a src/api.js")
Task("Frontend: usa ask_gemini_pro → escribe a src/App.jsx")
Task("Tests: usa ask_qwen → escribe a tests/")
# Claude espera a todos → ensambla → git commit
```

---

## Consumo esperado

| Escenario | Sin delegación | Con delegación | Reducción |
|-----------|---------------|----------------|-----------|
| Investigación (10 fuentes + síntesis) | ~18.000 tokens Claude | ~800 tokens Claude | 96% |
| Generación de componente React | ~5.000 tokens Claude | ~300 tokens Claude | 94% |
| Feature full-stack (3 sub-agentes) | ~15.000 tokens Claude | ~500 tokens Claude | 97% |

---

## Troubleshooting

### Self-audit — si el consumo de Claude es alto:
- [ ] ¿Análisis >300 palabras delegado a `ask_gemini`?
- [ ] ¿Código >50 líneas usando `ask_qwen` o `ask_gemini_pro`?
- [ ] ¿Sub-agentes usando modelos externos (no generando ellos mismos)?
- [ ] ¿Tasks independientes corriendo en paralelo (no secuencial)?
- [ ] ¿Multi-doc usando `parse_document`?

### Qwen no responde:
```bash
OLLAMA_VULKAN=1 ollama serve          # GPU AMD RDNA 4 (gfx1201)
curl http://localhost:11434/v1/models  # verificar modelos
```
El servicio systemd ya incluye `OLLAMA_VULKAN=1`. Sin esa variable Ollama usa CPU.

### Rate limits Gemini (tier gratuito):
- Flash (`ask_gemini`): 15 RPM
- Pro (`ask_gemini_pro`): 5 RPM
- Fallback: si Pro da rate limit → simplificar task y usar Flash

### Herramientas MCP no aparecen:
1. Verificar `~/.claude.json` → global `mcpServers` tiene `gemini` y `qwen`
2. Reiniciar Claude Code
3. Comprobar que Ollama está activo para `ask_qwen`
