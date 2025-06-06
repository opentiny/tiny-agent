import type { ToolCall } from './type.js';

export const FINAL_ANSWER_ACTION = 'Final Answer:';

export async function extractActions(text: string): Promise<[ToolCall[], string]> {
  if (text.includes(FINAL_ANSWER_ACTION) || !text.includes(`"action":`)) {
    const parts = text.split(FINAL_ANSWER_ACTION);
    const output = parts[parts.length - 1].trim();
    return [[], output];
  }

  const toolCalls: ToolCall[] = [];

  if (text.includes('```')) {
    const actionBlocks = text
      .trim()
      .split(/```(?:json)?/)
      .filter((block) => block.includes(`"action":`));

    actionBlocks.forEach((block) => {
      try {
        const response = JSON.parse(block.trim());

        toolCalls.push({
          id: response.action,
          type: 'function',
          function: {
            name: response.action,
            arguments:
              typeof response.action_input === 'string' ? response.action_input : JSON.stringify(response.action_input),
          },
        });
      } catch (_error) {}
    });
  }

  return [toolCalls, ''];
}
