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

/**
 * 从字符串中提取 action 和 action_input
 * @param str 包含 action 和 action_input 的字符串
 * @returns 包含 action 和 action_input 的对象数组
 */
export function extractActions(str: string): [ToolCall[], string] {
  let finalAnswer = '';
  const toolCalls: ToolCall[] = [];

  const actions: Array<{ action: string; action_input: string }> = matchReAct(str);

  actions.forEach(({ action, action_input }) => {
    if (action === 'Final Answer') {
      finalAnswer = action_input;

      return;
    }

    toolCalls.push({
      id: action,
      type: 'function',
      function: {
        name: action,
        arguments: JSON.stringify(action_input),
      },
    });
  });

  return [toolCalls, finalAnswer];
}
