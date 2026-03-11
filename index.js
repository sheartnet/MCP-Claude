#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.ZAI_API_KEY;
const API_BASE = "https://api.z.ai/api/paas/v4"; // Z.ai API endpoint

// Create server instance
const server = new Server(
  {
    name: "glm5-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_glm5",
        description: "Delegate tasks to GLM-5 (Z.ai's flagship 744B parameter model). Use this for: complex reasoning, advanced analysis, system design, and demanding cognitive tasks. Best overall performance.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The task/question to send to GLM-5. Be specific and detailed.",
            },
            system_prompt: {
              type: "string",
              description: "Optional system prompt to guide GLM-5's behavior (e.g., 'You are an expert Python developer')",
            },
            temperature: {
              type: "number",
              description: "Temperature for response randomness (0.0-1.0). Default: 0.7",
              default: 0.7,
            },
            max_tokens: {
              type: "number",
              description: "Maximum tokens in response. Default: 4000",
              default: 4000,
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "ask_glm5_pro",
        description: "Delegate to GLM-5 (Z.ai's flagship 744B parameter model) with coding-optimized system prompt. Use this for: code generation, programming tasks, refactoring, debugging, and technical implementation. Optimized for software development.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The complex task/question to send to GLM-5 Pro",
            },
            system_prompt: {
              type: "string",
              description: "Optional system prompt to guide GLM-5 Pro's behavior",
            },
            temperature: {
              type: "number",
              description: "Temperature for response randomness (0.0-1.0). Default: 0.7",
              default: 0.7,
            },
            max_tokens: {
              type: "number",
              description: "Maximum tokens in response. Default: 4000",
              default: 4000,
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "web_search",
        description: "LLM-optimized web search for competitive intelligence, market research, and real-time information. Delegate when: user asks for competitive research, market trends, company background, content sources (>3), or real-time news. Returns structured summaries ready for analysis.",
        inputSchema: {
          type: "object",
          properties: {
            search_query: {
              type: "string",
              description: "The search query. Be specific and detailed.",
            },
            count: {
              type: "number",
              description: "Number of results to return (1-50). Default: 10. Use 50 for deep research, 5 for quick checks.",
              default: 10,
              minimum: 1,
              maximum: 50,
            },
            search_recency_filter: {
              type: "string",
              description: "Time range filter. Options: oneDay (breaking news), oneWeek (recent), oneMonth (trends), oneYear (annual), noLimit (all time). Default: noLimit",
              enum: ["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"],
              default: "noLimit",
            },
            search_domain_filter: {
              type: "string",
              description: "Whitelist specific domains (e.g., 'techcrunch.com,venturebeat.com'). Optional.",
            },
          },
          required: ["search_query"],
        },
      },
      {
        name: "web_reader",
        description: "Fetch and parse full content from a specific URL. Use this to read articles, blog posts, documentation, competitor pages, or any web content after finding it via web_search. Returns markdown-formatted content ready for analysis. Delegate when: user provides a URL to read, needs full article/page content, or wants to analyze specific web pages.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch and parse. Must be a valid http/https URL.",
            },
            return_format: {
              type: "string",
              description: "Content format. Options: markdown (default, best for LLM), text (plain text). Default: markdown",
              enum: ["markdown", "text"],
              default: "markdown",
            },
            with_images_summary: {
              type: "boolean",
              description: "Include summary of images found on page. Default: false",
              default: false,
            },
            with_links_summary: {
              type: "boolean",
              description: "Include summary of links found on page. Default: false",
              default: false,
            },
            timeout: {
              type: "number",
              description: "Request timeout in seconds. Default: 20",
              default: 20,
            },
          },
          required: ["url"],
        },
      },
      {
        name: "parse_document",
        description: "Extract text from documents, images, and PDFs using GLM-OCR. Handles complex layouts, tables, multi-column text. Use for: PDF proposals/contracts, business cards, competitor materials, scanned documents, invoices. Delegate when: user uploads PDF/image for text extraction, document analysis needed (>1 page), or OCR parsing required. Supports up to 50MB files or 100 pages.",
        inputSchema: {
          type: "object",
          properties: {
            file_url: {
              type: "string",
              description: "URL of the file to parse (image or PDF). Must be a publicly accessible URL.",
            },
            return_format: {
              type: "string",
              description: "Output format. Options: markdown (default, best for LLM), text (plain text). Default: markdown",
              enum: ["markdown", "text"],
              default: "markdown",
            },
            parse_mode: {
              type: "string",
              description: "Parsing mode. Options: auto (automatic detection, default), ocr (force OCR), layout (preserve layout). Default: auto",
              enum: ["auto", "ocr", "layout"],
              default: "auto",
            },
          },
          required: ["file_url"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Handle web search
  if (name === "web_search") {
    try {
      const requestBody = {
        search_engine: "search-prime",
        search_query: args.search_query,
      };

      // Add optional parameters if provided
      if (args.count) {
        requestBody.count = args.count;
      }
      if (args.search_recency_filter) {
        requestBody.search_recency_filter = args.search_recency_filter;
      }
      if (args.search_domain_filter) {
        requestBody.search_domain_filter = args.search_domain_filter;
      }

      const response = await fetch(`${API_BASE}/web_search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Web Search API Error] ${response.status} - ${errorText}`);
        throw new Error(`Z.ai Web Search error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.error(`[Web Search Debug] Search completed:`, {
        query: args.search_query,
        results: data.search_result?.length || 0,
      });

      // Format results for LLM consumption
      const results = data.search_result || [];
      let formattedResults = `Web Search Results for: "${args.search_query}"\n`;
      formattedResults += `Found ${results.length} results\n\n`;

      results.forEach((result, index) => {
        formattedResults += `[${index + 1}] ${result.title}\n`;
        formattedResults += `URL: ${result.link}\n`;
        if (result.content) {
          formattedResults += `Summary: ${result.content}\n`;
        }
        if (result.media) {
          formattedResults += `Source: ${result.media}\n`;
        }
        if (result.publish_date) {
          formattedResults += `Published: ${result.publish_date}\n`;
        }
        formattedResults += `\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing web search: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Handle web reader
  if (name === "web_reader") {
    try {
      const requestBody = {
        url: args.url,
        return_format: args.return_format || "markdown",
        timeout: args.timeout || 20,
      };

      // Add optional parameters if provided
      if (args.with_images_summary !== undefined) {
        requestBody.with_images_summary = args.with_images_summary;
      }
      if (args.with_links_summary !== undefined) {
        requestBody.with_links_summary = args.with_links_summary;
      }

      const response = await fetch(`${API_BASE}/reader`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Web Reader API Error] ${response.status} - ${errorText}`);
        throw new Error(`Z.ai Web Reader error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.error(`[Web Reader Debug] Page fetched:`, {
        url: args.url,
        title: data.reader_result?.title || "No title",
        content_length: data.reader_result?.content?.length || 0,
      });

      // Format results for LLM consumption
      const result = data.reader_result;
      let formattedContent = `Web Page Content from: ${args.url}\n\n`;

      if (result.title) {
        formattedContent += `# ${result.title}\n\n`;
      }

      if (result.description) {
        formattedContent += `**Description:** ${result.description}\n\n`;
      }

      formattedContent += `---\n\n`;
      formattedContent += result.content || "No content available";

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading web page: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Handle document parsing (GLM-OCR)
  if (name === "parse_document") {
    try {
      const requestBody = {
        file_url: args.file_url,
        return_format: args.return_format || "markdown",
      };

      // Add optional parse mode if provided
      if (args.parse_mode) {
        requestBody.parse_mode = args.parse_mode;
      }

      const response = await fetch(`${API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "glm-4.6v",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: args.file_url,
                  },
                },
                {
                  type: "text",
                  text: `Extract all text from this document using OCR. Format the output as ${requestBody.return_format}. Preserve layout structure, tables, and formatting. Be thorough and accurate.`,
                },
              ],
            },
          ],
          temperature: 0.1, // Low temperature for accurate OCR
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Document Parser API Error] ${response.status} - ${errorText}`);
        throw new Error(`Z.ai Document Parser error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.error(`[Document Parser Debug] Document parsed:`, {
        file_url: args.file_url,
        format: requestBody.return_format,
        content_length: data.choices?.[0]?.message?.content?.length || 0,
      });

      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error(`GLM-OCR returned empty response. Full data: ${JSON.stringify(data)}`);
      }

      let formattedContent = `Document Parsing Results from: ${args.file_url}\n\n`;
      formattedContent += `Format: ${requestBody.return_format}\n`;
      formattedContent += `---\n\n`;
      formattedContent += content;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error parsing document: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "ask_glm5" || name === "ask_glm5_pro") {
    // Official Z.ai model names from https://docs.z.ai
    // glm-5: Latest flagship model with strong reasoning (both tools use this)
    // glm-4.7: Previous generation (alternative option)
    const model = "glm-5"; // Both tools use GLM-5 for now

    try {
      const messages = [];

      // Add system prompt - either user-provided or default for coding
      if (args.system_prompt) {
        messages.push({
          role: "system",
          content: args.system_prompt,
        });
      } else if (name === "ask_glm5_pro") {
        // Default coding-optimized system prompt for ask_glm5_pro
        messages.push({
          role: "system",
          content: "You are an expert software engineer. Provide clean, efficient, well-documented code with best practices. Focus on correctness, readability, and maintainability."
        });
      }

      messages.push({
        role: "user",
        content: args.prompt,
      });

      const response = await fetch(`${API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: args.temperature || 0.7,
          max_tokens: args.max_tokens || 4000,
          thinking: { type: "disabled" }, // Disable thinking mode for cleaner responses
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GLM-5 API Error] ${response.status} - ${errorText}`);
        throw new Error(`Z.ai API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.error(`[GLM-5 Debug] Full API response:`, JSON.stringify(data, null, 2));

      // GLM-5 can return content in either 'content' or 'reasoning_content' field
      // When thinking mode is enabled, reasoning is in 'reasoning_content' and final answer in 'content'
      const message = data.choices?.[0]?.message;
      const content = message?.content || message?.reasoning_content;

      if (!content) {
        console.error(`[GLM-5 Error] Empty or missing content in response`);
        throw new Error(`GLM-5 returned empty response. Full data: ${JSON.stringify(data)}`);
      }

      return {
        content: [
          {
            type: "text",
            text: `GLM-5 Response:\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error calling GLM-5: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GLM-5 MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
