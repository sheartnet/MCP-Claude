# Contributing to Claude Additional Models MCP

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🎯 Project Goals

1. **Reduce Claude consumption** - Help users get more value from their Claude Pro subscriptions
2. **Multi-provider support** - Integrate multiple external AI models (Gemini, Qwen local, and future providers) with Claude Desktop
3. **Reliability** - Tools should work consistently and handle errors gracefully
4. **Simplicity** - Keep the codebase simple and maintainable

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Claude Desktop installed
- API key for the integration you want to test:
  - **Gemini:** Google API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free tier available)
  - **Qwen (local):** Ollama installed with `qwen2.5-coder:14b` (no API key needed)

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-additional-models-mcp.git
cd claude-additional-models-mcp

# Install dependencies
npm install

# Create a test config
cp claude_desktop_config.example.json claude_desktop_config.json
# Edit and add your the relevant API key

# Test the server
npm start
```

## 📝 How to Contribute

### Reporting Bugs

**Before submitting a bug report:**
- Check existing issues to avoid duplicates
- Test with the latest version
- Collect error messages and logs

**Bug report should include:**
- Clear title and description
- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, Node version, Claude Desktop version)
- Error messages and logs
- Screenshots if applicable

### Suggesting Features

**Good feature suggestions:**
- Solve a real problem
- Align with project goals
- Include use cases and examples
- Consider implementation complexity

**Feature request template:**
```markdown
## Problem
Describe the problem this feature solves

## Proposed Solution
How should this work?

## Use Cases
Who benefits and how?

## Alternatives Considered
What other approaches exist?
```

### Pull Requests

**Before starting work:**
1. Check existing issues and PRs
2. Comment on the issue to claim it
3. For large changes, discuss first in an issue

**PR checklist:**
- [ ] Code follows existing style
- [ ] Comments added for complex logic
- [ ] README updated if needed
- [ ] Tested in Claude Desktop
- [ ] No API keys or secrets in code
- [ ] Descriptive commit messages

**PR template:**
```markdown
## Changes
What does this PR do?

## Motivation
Why is this change needed?

## Testing
How was this tested?

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Tested in Claude Desktop
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🔧 Development Guidelines

### Code Style

**General principles:**
- Clear over clever
- Explicit over implicit
- Comments for "why", not "what"
- Descriptive variable names

**Specific conventions:**
```javascript
// Use async/await, not callbacks
async function fetchData() {
  const response = await fetch(url);
  return await response.json();
}

// Handle errors explicitly
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('[Context] Error:', error);
  return { success: false, error: error.message };
}

// Use descriptive names
const userMessage = args.prompt; // Good
const m = args.prompt;           // Bad

// Add JSDoc for complex functions
/**
 * Formats search results for LLM consumption
 * @param {Array} results - Raw search results from API
 * @returns {string} Formatted markdown string
 */
function formatSearchResults(results) {
  // ...
}
```

### Tool Design Principles

**Each tool should:**
1. Do one thing well
2. Have clear, self-documenting parameters
3. Return structured, LLM-friendly output
4. Handle errors gracefully
5. Log useful debugging information

**Tool naming:**
- Use verbs: `ask_`, `get_`, `parse_`, `search_`
- Be specific: `parse_document` not `parse`
- Avoid abbreviations: `web_search` not `ws`

**Parameter design:**
```javascript
// Good: Clear, typed, with defaults
{
  name: "search_query",
  type: "string",
  description: "The search query. Be specific and detailed.",
  required: true
}

// Good: Optional with sensible default
{
  name: "count",
  type: "number",
  description: "Number of results (1-50). Default: 10",
  default: 10,
  minimum: 1,
  maximum: 50
}

// Bad: Vague, no guidance
{
  name: "opts",
  type: "object"
}
```

### Error Handling

**Always:**
- Catch and log errors
- Return helpful error messages
- Include context in logs
- Never expose API keys in errors

**Example:**
```javascript
try {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Tool Name] API Error ${response.status}:`, errorText);
    throw new Error(`API returned ${response.status}: ${errorText}`);
  }

  return await response.json();
} catch (error) {
  console.error('[Tool Name] Failed:', error.message);
  return {
    content: [{
      type: "text",
      text: `Error in tool_name: ${error.message}`
    }],
    isError: true
  };
}
```

### Testing

**Manual testing checklist:**
1. Test happy path (correct input)
2. Test error cases (invalid input, API errors)
3. Test edge cases (empty results, timeout, etc.)
4. Test in Claude Desktop end-to-end
5. Check error messages are helpful
6. Verify no secrets logged

**Test scenarios:**
```javascript
// Happy path
ask_qwen({ prompt: "What is MCP?" })

// Missing required param
ask_qwen({}) // Should fail gracefully

// Invalid parameter
web_search({ count: 1000 }) // Should validate

// Network error
// Disconnect network, try tool

// Empty response
// Mock API to return empty data
```

## 🏗️ Adding New Tools

### Step-by-Step Guide

1. **Research the API**
   - Read the provider's API documentation (Z.ai docs, Google AI docs, etc.)
   - Test API with curl/Postman
   - Understand response format

2. **Design the tool**
   - Choose clear name
   - Define parameters
   - Plan output format
   - Consider error cases

3. **Implement**
   ```javascript
   // Add to ListToolsRequestSchema handler
   {
     name: "your_tool",
     description: "Clear description of what it does and when to use it",
     inputSchema: {
       type: "object",
       properties: {
         // Define parameters
       },
       required: ["required_param"]
     }
   }

   // Add to CallToolRequestSchema handler
   if (name === "your_tool") {
     try {
       // Implement tool logic
       // Call API
       // Format response
       // Return structured output
     } catch (error) {
       // Handle error
     }
   }
   ```

4. **Document**
   - Add to README tool list
   - Include parameters
   - Add usage example
   - Update roadmap if needed

5. **Test**
   - Test all scenarios
   - Verify in Claude Desktop
   - Check error handling

6. **Submit PR**
   - Clear description
   - Screenshots of testing
   - Updated documentation

### Adding a New Provider Integration

To add support for a new AI model provider (e.g., DeepSeek, Mistral):

1. Create a new directory: `provider-name/`
2. Add `index.js` and `package.json` following the existing pattern
3. Implement the same 5 tool interfaces: `ask_[model]`, `ask_[model]_pro`, `web_search`, `web_reader`, `parse_document`
4. Add a `CLAUDE.md` with provider-specific delegation guidelines
5. Update the root README with setup instructions
6. Submit a PR with testing evidence

## 📚 Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [Google AI Studio](https://aistudio.google.com) (Gemini integration)
- [Ollama](https://ollama.ai) (Qwen local inference)
- [Claude Desktop](https://claude.ai/download)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 Community

- **Discussions:** Use GitHub Discussions for questions and ideas
- **Issues:** Use GitHub Issues for bugs and feature requests
- **PRs:** Use Pull Requests for code contributions

## 📜 Code of Conduct

**Be respectful:**
- Welcome newcomers
- Be patient with questions
- Give constructive feedback
- Assume good intentions

**Be collaborative:**
- Credit others' work
- Share knowledge
- Help review PRs
- Improve documentation

**Be professional:**
- Keep discussions on-topic
- No harassment or discrimination
- Respect maintainer decisions
- Follow community guidelines

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

Thank you for helping make Claude more accessible and affordable for everyone!
