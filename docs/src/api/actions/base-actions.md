# Base Actions

DOM 和 BOM 操作执行器，用于模拟用户对页面上的 DOM 元素 以及 BOM api 进行各种操作

## Action 说明

### clickByText

- **名称**：clickByText
- **描述**：根据文本内容查找元素并点击
- **入参**：
  - params(object):
    - selector(string): 查找元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
    - text(string): 要查找的文本内容
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success，失败为 error
  - error(object): 失败时包含错误信息

### highlight

- **名称**：highlight
- **描述**：高亮指定元素
- **入参**：
  - params(object):
    - selector(string): 元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success

### insertBefore

- **名称**：insertBefore
- **描述**：在指定元素前插入新元素
- **入参**：
  - params(object):
    - selector(string): 目标元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
    - content(string): 要插入的新元素的内容
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
- **错误处理**：若缺少 content 参数，抛出错误

### scrollTo

- **名称**：scrollTo
- **描述**：滚动到指定元素
- **入参**：
  - params(object):
    - selector(string): 元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success

### click

- **名称**：click
- **描述**：点击指定元素
- **入参**：
  - params(object):
    - selector(string): 元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success

### doubleClick

- **名称**：doubleClick
- **描述**：双击指定元素
- **入参**：
  - params(object):
    - selector(string): 元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
  - result(object): 包含上下文结果信息

### rightClick

- **名称**：rightClick
- **描述**：右键点击指定元素
- **入参**：
  - params(object):
    - selector(string): 元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success

### goBack

- **名称**：goBack
- **描述**：后退操作
- **入参**：
  - params(object): 无
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success

### goForward

- **名称**：goForward
- **描述**：前进操作
- **入参**：
  - params(object): 无
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success

### findDom

- **名称**：findDom
- **描述**：查找指定 DOM 元素
- **入参**：
  - params(object):
    - selector(string): 元素的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
  - result(object): 包含找到的 DOM 元素的 outerHTML 数组

