#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen2.5-coder:14b";

const qwen = new OpenAI({
  apiKey: "ollama",
  baseURL: OLLAMA_BASE_URL,
});

const server = new Server(
  { name: "qwen-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_qwen",
        description:
          "Delegate code tasks to Qwen2.5-Coder running locally via Ollama. Use for: boilerplate generation, completing functions, writing tests, simple scripts, routine code (<100 lines). Runs on local GPU — free and fast.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The coding task to delegate to Qwen. Be specific.",
            },
            system_prompt: {
              type: "string",
              description:
                "Optional system prompt (e.g., 'You are an expert Rust developer'). Defaults to expert software engineer.",
            },
            temperature: {
              type: "number",
              description: "Temperature (0.0-1.0). Default: 0.2 for code tasks.",
              default: 0.2,
            },
            max_tokens: {
              type: "number",
              description: "Max tokens in response. Default: 4096",
              default: 4096,
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "ask_qwen") {
    try {
      const messages = [];

      const systemPrompt = args.system_prompt ||
        "You are an expert software engineer. Write clean, efficient, correct code. Be concise — provide working code without unnecessary explanation unless asked.";

      messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: args.prompt });

      const completion = await qwen.chat.completions.create({
        model: QWEN_MODEL,
        messages,
        temperature: args.temperature ?? 0.2,
        max_tokens: args.max_tokens || 4096,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("Qwen returned empty response");
      }

      return {
        content: [{ type: "text", text: `Qwen Response:\n\n${content}` }],
      };
    } catch (error) {
      console.error(`[Qwen MCP Error] ask_qwen:`, error.message);
      return {
        content: [
          {
            type: "text",
            text: `Error calling Qwen (ask_qwen): ${error.message}\n\nMake sure Ollama is running: OLLAMA_VULKAN=1 ollama serve`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Qwen MCP Server running (model: ${QWEN_MODEL})`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
