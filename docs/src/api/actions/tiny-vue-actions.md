# TinyVue Actions

[TinyVue 组件库](https://opentiny.design/tiny-vue/zh-CN/os-theme/overview)操作执行器，模拟用户操作的方式 TinyVue 组件库

### selectDate

- **名称**：selectDate
- **描述**：选择日期
- **入参**：
  - params(object):
    - selector(string): 日期选择器的选择器
    - date(string): 要选择的日期，格式为 YYYY-MM-DD
  - context(object): 上下文信息
- **出参**：
  - status(string): 执行结果状态，成功为 success
