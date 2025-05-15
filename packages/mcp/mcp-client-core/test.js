import { createMCPClient } from "./dist/index.js";
import readline from "readline/promises";

if (process.argv.length < 3) {
  console.log("Usage: node index.js <path_to_server_script>");
  process.exit(1);
}

const client = await createMCPClient({
  llmConfig: {
    apiKey: process.env.OPEN_ROUTER_API_KEY,
    model: process.env.OPEN_ROUTER_MODEL,
    systemPrompt: "You are a helpful assistant with access to tools."
  },
  mcpServerConfig: {
    url: "http://localhost:3000/mcp",
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  console.log("\nMCP Client Started!");
  console.log("Type your queries or 'quit' to exit.");

  while (true) {
    const message = await rl.question("\nQuery: ");
    if (message.toLowerCase() === "quit") {
      break;
    }

    try {
      const response = await client.processQuery(message);
      console.log("\n" + response.text);
    } catch (error) {
      console.log("\nError:", error);
    }
  }
} finally {
  rl.close();
  await client.cleanup();
}
