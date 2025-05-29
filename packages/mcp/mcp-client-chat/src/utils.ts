import type { ToolCall } from './type.js'

/**
 * 从字符串中提取 action 和 action_input
 * @param str 包含 action 和 action_input 的字符串
 * @returns 包含 action 和 action_input 的对象数组
 */
export function extractActions(str: string): ToolCall[] {
  const results: ToolCall[] = []

  // 匹配 Action: 后面的代码块
  const actionBlocks = str.match(/Action:\s*```json\s*(\{[\s\S]*?\})\s*```/g)

  if (actionBlocks) {
    actionBlocks.forEach((block) => {
      try {
        // 提取代码块中的 JSON 对象
        const jsonMatch = block.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          const jsonObj = JSON.parse(jsonMatch[1])
          const { action, action_input } = jsonObj
          if (action && action_input && action !== 'Final Answer') {
            results.push({
              id: action,
              type: 'function',
              function: {
                name: action,
                arguments: JSON.stringify(action_input)
              }
            })
          }
        }
      } catch (e) {
        console.warn('Failed to parse action JSON:', e)
      }
    })
  }

  return results
}
