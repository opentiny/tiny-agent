# Form Actions

表单操作执行器，用于模拟用户在表单元素上的各种操作

## Action 说明

### input

- **名称**：input
- **描述**：模拟用户在输入框中输入文本
- **入参**：
  - params(object):
    - selector(string): 输入框的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
    - value(string): 要输入的文本内容
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
- **错误处理**：若执行失败，抛出错误

### radio

- **名称**：radio
- **描述**：模拟用户选择单选按钮
- **入参**：
  - params(object):
    - selector(string): 单选按钮的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
- **错误处理**：若执行失败，抛出错误

### checkbox

- **名称**：checkbox
- **描述**：模拟用户选择复选框
- **入参**：
  - params(object):
    - selector(string): 复选框的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
    - checked(boolean): 是否选中复选框
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
- **错误处理**：若执行失败，抛出错误

### select

- **名称**：select
- **描述**：模拟用户选择下拉列表选项
- **入参**：
  - params(object):
    - selector(string): 下拉列表的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
    - value(string): 要选择的选项值
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
- **错误处理**：若执行失败，抛出错误

### submit

- **名称**：submit
- **描述**：模拟用户点击提交按钮
- **入参**：
  - params(object):
    - selector(string): 提交按钮的选择器
    - timeout(number): 查找元素的超时时间，默认为 3000 毫秒
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
- **错误处理**：若执行失败，抛出错误
