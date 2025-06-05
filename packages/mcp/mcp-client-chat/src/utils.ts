import type { ToolCall } from './type.js';

const matchReAct = (str: string): Array<{ action: string; action_input: string }> => {
  // 创建正则表达式，匹配标签及其内容
  const regex = /```json([\s\S]*?)```/g;

  // 存储所有匹配结果
  const results = [];

  // 循环匹配所有内容
  const matches = str.matchAll(regex);

  for (const match of matches) {
    try {
      const result = JSON.parse(match[1]);
      results.push(result);
    } catch (_error) {}
    // match[1] 包含标签内的内容
  }

  return results;
};

export const FINAL_ANSWER_ACTION = 'Final Answer:';

/**
 * 从字符串中提取 action 和 action_input
 * @param str 包含 action 和 action_input 的字符串
 * @returns 包含 action 和 action_input 的对象数组
 */
export async function extractActions(text: string): Promise<[ToolCall[], string]> {
  if (text.includes(FINAL_ANSWER_ACTION) || !text.includes(`"action":`)) {
    const parts = text.split(FINAL_ANSWER_ACTION);
    const output = parts[parts.length - 1].trim();
    return [[], output];
  }

  const action = text.includes('```') ? text.trim().split(/```(?:json)?/)[1] : text.trim();
  try {
    const response = JSON.parse(action.trim());

    return [
      [
        {
          id: response.action,
          type: 'function',
          function: {
            name: response.action,
            arguments: response.action_input,
          },
        },
      ],
      '',
    ];
  } catch {
    throw new Error(`Unable to parse JSON response from chat agent.\n\n${text}`);
  }
}
