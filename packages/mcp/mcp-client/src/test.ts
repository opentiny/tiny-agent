import { createMCPClient } from './index.js';
import path from 'path';

async function testMCPClient() {
  // 创建客户端实例
  const client = await createMCPClient({
    serverScriptPath: path.join(__dirname, 'scripts', 'weather.tool.js'),
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    apiKey: process.env.OPENAI_API_KEY as string,
    baseURL: process.env.OPENAI_BASE_URL as string,
  });

  try {
    // 测试用例
    const testCases = [
      "What's the weather like in California?",
      "Are there any weather alerts in New York?",
      "Tell me about the weather in Texas"
    ];

    console.log('Starting MCP Client tests...\n');

    for (const query of testCases) {
      console.log(`\nTest Query: "${query}"`);
      console.log('----------------------------------------');

      try {
        const result = await client.processQuery(query);
        console.log('\nResponse:');
        console.log(result.text);

        if (result.toolResults.length > 0) {
          console.log('\nTool Calls:');
          result.toolResults.forEach(toolResult => {
            console.log(`- Tool: ${toolResult.call}`);
            console.log(`  Result: ${JSON.stringify(toolResult.result, null, 2)}`);
          });
        }
      } catch (error) {
        console.error('Error processing query:', error);
      }

      console.log('----------------------------------------');
    }

  } finally {
    // 清理资源
    await client.cleanup();
  }
}

// 运行测试
testMCPClient().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 