# User Guide Actions

用户引导操作执行器，用于显示用户引导模态框

## Action 说明

### userGuide

- **名称**：userGuide
- **描述**：显示用户引导模态框，并暂停任务执行，直到模态框关闭
- **入参**：
  - params(object):
    - selector(string): 目标元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
    - title(string): 模态框的标题
    - text(string): 模态框的内容文本
    - tip(string): 提示信息
  - context(object): 上下文信息，需包含 $task 和 $taskUI
- **出参**：
  - status(string): 执行结果状态，成功为 success
