import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface McpServer {
  url: string;
  header?: Record<string, string>;
  timeout?: number;
}

export type McpServers = Record<string, McpServer>;

export interface McpServerConfig {
  mcpServers: McpServers;
}

export type McpServersConfig = Record<string, McpServerConfig>;

export interface MCPClientOptions {
  clientId: string;
  llmConfig: {
    // 模型配置
    apiKey: string; // 模型 api key
    model: string; // 模型名
    systemPrompt: string; // 指令
  };
  mcpServersConfig: McpServersConfig; // MCP 服务配置
  maxIterationSteps?: number; // 最大执行步数
}

export interface AvailableTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: {
      type: 'object';
      properties?: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface CallToolsParams {
  toolCalls: {
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  messages: ChatCompletionMessageParam[];
}

export interface ChatBody {
  messages: ChatCompletionMessageParam[];
  tools?: AvailableTool[];
}

export type ToolResults = Array<{ call: string; result: any }>;
