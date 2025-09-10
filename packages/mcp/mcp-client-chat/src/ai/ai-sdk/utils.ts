import type {
  ModelMessage,
  UserModelMessage,
  AssistantModelMessage,
  AssistantContent,
  ToolCallPart,
  ToolResultPart,
  ToolModelMessage,
  SystemModelMessage,
  UserContent,
  TextStreamPart,
  ToolSet,
} from 'ai';
import { Role } from '../../type.js';
import type { ChatCompleteResponse, Message, StreamingChoice } from '../../type.js';

// 将 opneai 格式的 messages 转换为 ai-sdk 格式的 messages
export const transformMessagesToAiSdk = (messages: Message[]): ModelMessage[] => {
  return messages
    .map((msg) => {
      if (msg.role === 'user') {
        const userMessage: UserModelMessage = {
          role: 'user',
          content: msg.content as UserContent,
        };

        return userMessage;
      }
      if (msg.role === 'assistant') {
        let assistantMessage: AssistantModelMessage;
        let content: AssistantContent = msg.content as string;

        if (msg.tool_calls) {
          const toolCallsContent: ToolCallPart[] = msg.tool_calls.map((toolCall) => ({
            type: 'tool-call',
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            input: (() => {
              if (!toolCall.function.arguments) {
                return {};
              }

              try {
                return JSON.parse(toolCall.function.arguments);
              } catch (error) {
                console.error(`Failed to parse tool arguments: ${toolCall.function.arguments}`, error);
                return {};
              }
            })(),
          }));

          content = toolCallsContent;
        }

        assistantMessage = {
          role: 'assistant',
          content,
        };

        return assistantMessage;
      }
      if (msg.role === 'system') {
        const systemMessage: SystemModelMessage = {
          role: 'system',
          content: msg.content as string,
        };

        return systemMessage;
      }
      if (msg.role === 'tool') {
        const toolResultPart: ToolResultPart = {
          type: 'tool-result',
          toolCallId: msg.tool_call_id,
          toolName: msg.name as string,
          output: {
            type: 'text',
            value: msg.content,
          },
        };
        const toolMessage: ToolModelMessage = {
          role: 'tool',
          content: [toolResultPart],
        };

        return toolMessage;
      }

      return undefined;
    })
    .filter(Boolean) as ModelMessage[];
};

export const convertToStandardChunk = (model: string, chunk: TextStreamPart<ToolSet>): ChatCompleteResponse => {
  const choice: StreamingChoice = {
    finish_reason: '',
    native_finish_reason: '',
    delta: {
      content: '',
      role: Role.ASSISTANT,
    },
  };
  const result: ChatCompleteResponse = {
    id: '',
    created: 0,
    object: 'chat.completion.chunk',
    model,
    choices: [choice],
  };

  switch (chunk.type) {
    default:
      break;
  }

  return result;
};
