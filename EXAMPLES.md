# 🚀 MCP Server Examples: GLM-5 & Gemini 3.x

This guide provides real-world scenarios and implementation patterns for using the GLM-5 (Z.ai) and Gemini 3.x (Google) MCP servers within Claude Desktop. By offloading heavy reasoning, massive web searches, and long-document processing to these external models, you preserve Claude's context window and reduce token costs.

---

## 📊 Quick Reference

| Task | GLM-5 Tools | Gemini Tools | Time Saved |
| :--- | :--- | :--- | :--- |
| **Deep Research** | `glm_web_search`, `ask_glm` | `gemini_search`, `ask_gemini` | ~15 mins |
| **Contract Review** | `parse_document`, `ask_glm` | `parse_document`, `ask_gemini_pro` | ~30 mins |
| **Code Generation** | `ask_glm_pro` | `ask_gemini_pro` | ~10 mins |
| **Market Synthesis** | `glm_web_reader`, `ask_glm` | `gemini_web_reader`, `ask_gemini` | ~45 mins |
| **Multi-PDF Compare**| `parse_document`, `ask_glm` | `parse_document`, `ask_gemini` | ~1 hour |

---

## 🔍 Section 1: Competitive Intelligence
*Analyze a competitor's recent product launch by searching the web and synthesizing findings.*

### GLM-5 Implementation
**Claude Prompt:** "Search for the latest press releases from [Competitor X] regarding their new 'Cloud-Native' engine. Read the top 3 articles and use GLM-5 to summarize their technical advantages over our current stack."

**Tool Sequence:**
1. `glm_web_search(query="Competitor X Cloud-Native engine press release")`
2. `glm_web_reader(urls=["url_1", "url_2", "url_3"])`
3. `ask_glm(prompt="Based on these articles: [content], what are the 5 key technical advantages?")`

### Gemini Implementation
**Claude Prompt:** "Find the technical specs for [Competitor X]'s new engine using Gemini search. Have Gemini Pro analyze the architectural differences compared to industry standards."

**Tool Sequence:**
1. `gemini_search(query="technical specifications Competitor X Cloud-Native engine")`
2. `gemini_web_reader(urls=["url_1", "url_2"])`
3. `ask_gemini_pro(prompt="Analyze the architecture described here: [content]. Compare to standard Kubernetes-native patterns.")`

---

## 📄 Section 2: PDF Contract Review
*Reviewing a 50-page Master Service Agreement (MSA) for liability risks.*

### GLM-5 Implementation
**Tool Sequence:**
1. `parse_document(path="path/to/MSA_Draft.pdf")`
2. `ask_glm(prompt="Review the 'Limitation of Liability' and 'Indemnification' sections in the following text: [parsed_text]. Identify any clauses that deviate from standard enterprise norms.")`

### Gemini Implementation
**Tool Sequence:**
1. `parse_document(path="path/to/MSA_Draft.pdf")`
2. `ask_gemini_pro(prompt="Act as a senior legal counsel. Extract all termination triggers from this document: [parsed_text]. Present them in a risk-matrix table.")`

---

## 📈 Section 3: Market Research Report
*High-volume data gathering and synthesis across dozens of sources.*

### GLM-5 Implementation
**Claude Prompt:** "Perform a deep dive into the 2024 EV charging infrastructure market in Southeast Asia. Search at least 50 sources."

**Tool Sequence:**
1. `glm_web_search(query="EV charging infrastructure SE Asia 2024 trends", count=50)`
2. `glm_web_reader(urls=[...], parallel=true)`
3. `ask_glm(prompt="Synthesize these 50 sources into a market report covering: 1. CAGR, 2. Key Players, 3. Regulatory hurdles.")`

### Gemini Implementation
**Claude Prompt:** "Use Gemini to scrape the latest 50 news entries for 'Quantum Computing Commercialization'. Summarize the state of the industry."

**Tool Sequence:**
1. `gemini_search(query="Quantum computing commercialization news 2024", count=50)`
2. `gemini_web_reader(urls=[...])`
3. `ask_gemini(prompt="Process these reports and provide a timeline of expected commercial milestones for the next 5 years.")`

---

## 💻 Section 4: Code Generation
*Generating complex, boilerplate-heavy React components with state management.*

### GLM-5 Implementation
**Claude Prompt:** "I need a complex React dashboard component for real-time telemetry. Ask GLM-5 Pro to generate the full code using Tailwind CSS and Framer Motion."

**Tool Call:**
`ask_glm_pro(prompt="Generate a React component 'TelemetryDashboard'. It should include: 1. A responsive grid. 2. Recharts for live data. 3. Dark mode support. 4. Strict TypeScript types.")`

### Gemini Implementation
**Claude Prompt:** "Have Gemini Pro write a high-performance Node.js streaming service for processing large JSON files."

**Tool Call:**
`ask_gemini_pro(prompt="Write a Node.js script using the 'stream' API to parse a 10GB JSON file, filter by 'status: error', and write to a CSV. Optimize for low memory footprint.")`

---

## 🌐 Section 5: Multi-Source Research
*Synthesizing information from disparate formats (Web + PDF).*

### Both Integrations (Hybrid)
**Claude Prompt:** "Search for the latest 'Global Energy Outlook' PDF and also search for recent news articles about 'Green Hydrogen' subsidies in the EU. Use the model to compare the PDF's predictions with current news."

**Sequence:**
1. `glm_web_search(query="Global Energy Outlook 2024 filetype:pdf")`
2. `parse_document(path="downloaded_outlook.pdf")`
3. `gemini_search(query="EU green hydrogen subsidies news 2024")`
4. `ask_gemini_pro(prompt="Compare the projections in [PDF_DATA] with the reality of subsidies in [NEWS_DATA]. Are we on track?")`

---

## ⚡ Section 6: Parallel Execution (Gemini-Specific)
*Claude acts as an orchestrator, spawning sub-agents to handle a multi-part project simultaneously.*

**Scenario:** A comprehensive "Investment Memo" for a tech startup.

**Claude's Internal Execution Logic:**
1. **Sub-agent A (Executive Summary):**
   - `ask_gemini(prompt="Draft an executive summary based on the provided pitch deck text.")`
2. **Sub-agent B (Technical Audit):**
   - `ask_gemini_pro(prompt="Review the provided GitHub repo snippets. Identify potential scaling bottlenecks.")`
3. **Sub-agent C (Market Context):**
   - `gemini_search(query="Competitor landscape for [Startup Sector]")`
   - `gemini_web_reader(...)`
   - `ask_gemini(prompt="Summarize the competitive threats.")`

**Result:** Claude receives all three responses simultaneously.
**Token Savings:** Instead of Claude reading 50 pages of research, it only receives the three 500-word summaries, saving ~15,000 tokens in its primary context window.

---

## 🌍 Section 7: Document Translation + Analysis
*Processing foreign language technical documentation.*

**Claude Prompt:** "I have a technical manual in Japanese (PDF). Use GLM-5 to translate the 'Safety Protocols' section and then explain the maintenance schedule to me in English."

**Tool Sequence:**
1. `parse_document(path="manual_jp.pdf")`
2. `ask_glm(prompt="Translate the following Japanese technical text to English, focusing on safety: [text]")`
3. `ask_glm(prompt="Based on the translation, create a weekly maintenance checklist.")`

---

## 📂 Section 8: Data Synthesis from Multiple PDFs
*Comparing quarterly earnings across three different companies.*

**Claude Prompt:** "Analyze the Q3 earnings PDFs for Company A, B, and C. Identify which company has the best debt-to-equity ratio improvement."

**Tool Sequence:**
1. `parse_document(path="company_a_q3.pdf")`
2. `parse_document(path="company_b_q3.pdf")`
3. `parse_document(path="company_c_q3.pdf")`
4. `ask_gemini_pro(prompt="Extract the debt-to-equity ratios for these three companies: [Data A, B, C]. Compare them and rank them.")`

---

## 💡 Best Practices

### When to Delegate to External Models
*   **Context Volume:** If the source material is >5,000 words, delegate the reading to GLM or Gemini.
*   **Specialized Reasoning:** Use GLM-5 for complex logical puzzles or bilingual (CN/EN) tasks.
*   **Heavy Lifting:** Use Gemini Pro for massive code generation or 1M+ token context windows.

### Keep in Claude
*   **File Operations:** Use Claude's native capabilities for local file moving/renaming.
*   **Final Orchestration:** Let Claude be the "Editor-in-Chief" who assembles the outputs from external models.
*   **Quick Q&A:** If the answer is in the current chat history, don't waste an external API call.

### Prompt Engineering Tips
*   **Be Explicit:** When calling `ask_gemini` or `ask_glm`, include the context in the prompt: `"Using the text provided below, do X..."`
*   **Format Constraints:** Ask for JSON or Markdown in the tool prompt to make it easier for Claude to parse the result.

---

## 💰 ROI Calculator (Hypothetical)

| Feature | Without MCP | With GLM/Gemini MCP | Benefit |
| :--- | :--- | :--- | :--- |
| **Claude Context Usage** | 100% (High Cost) | 15-20% (Low Cost) | **80% Token Savings** |
| **Processing Speed** | Sequential | Parallel (Sub-agents) | **3x Faster Delivery** |
| **Research Depth** | Limited to 5-10 URLs | Up to 50+ URLs | **Higher Accuracy** |
| **Document Size** | Max 30MB / Context Limit | Up to 2GB (Gemini) | **Unlimited Scale** |

---

## 🛠 Advanced Patterns

### 1. Recursive Research
Claude uses `glm_web_search` to find a topic, calls `glm_web_reader`, finds a *new* keyword in that text, and automatically triggers a second search before presenting the final answer.

### 2. Comparative Analysis Pipeline
Claude sends the same prompt to *both* `ask_glm` and `ask_gemini_pro`, then compares their answers to find discrepancies or hallucinations.

### 3. Document Processing Workflow
1. `parse_document` -> 2. `ask_glm` (Summary) -> 3. `ask_gemini` (Action Items) -> 4. Claude (Email Draft).

### 4. Parallel Sub-Agent Orchestration
Claude breaks a complex prompt (e.g., "Build a business plan") into four tool calls. It executes them in one turn, gathering market data, financial projections, and SWOT analysis from the external models simultaneously.
