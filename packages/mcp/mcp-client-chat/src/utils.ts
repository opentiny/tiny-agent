import type { ToolCall } from './type.js';

export const FINAL_ANSWER_ACTION = 'Final Answer:';

export async function extractActions(text: string): Promise<[ToolCall[], string]> {
  if (text.includes(FINAL_ANSWER_ACTION) || !text.includes(`"action":`)) {
    const parts = text.split(FINAL_ANSWER_ACTION);
    const output = parts[parts.length - 1].trim();
    return [[], output];
  }

  const toolCalls: ToolCall[] = [];
  let finalAnswer = '';

  if (text.includes('```')) {
    const actionBlocks = text
      .trim()
      .split(/```(?:json)?/)
      .filter((block) => block.includes(`"action":`));

    actionBlocks.forEach((block) => {
      try {
        const { action, action_input } = JSON.parse(block.trim());

        if (action === FINAL_ANSWER_ACTION) {
          finalAnswer = action_input;

          return;
        }

        toolCalls.push({
          id: action,
          type: 'function',
          function: {
            name: action,
            arguments: typeof action_input === 'string' ? action_input : JSON.stringify(action_input),
          },
        });
      } catch (_error) {}
    });
  }

  return [toolCalls, finalAnswer];
}
