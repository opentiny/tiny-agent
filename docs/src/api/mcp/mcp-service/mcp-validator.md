# McpValidator

MCP工具调用验证器，

- **用法**

```typescript
const mcpValidator = new McpValidator()
const code = mcpValidator.genVerifyCode()

// ....

// 执行 MCP Tool 时候
const isVerify = await mcpValidator.verify(code)
```

## 方法

### genVerifyCode

异步函数，支持进行用户交互后再产生验证码

- **返回值**
  (string), 返回新的有效的验证码

### verify

异步函数，与内部残生的验证码进行比对，验证成功去掉缓存验证码

- **参数**
  code：外部验证码，与内部验证码进行比对

- **返回值**
  (boolean), 返回验证码是否有效，单次有效验证过后取消

### clearVerifyCode

清除验证码，用于交互完成后清除掉应过期的验证码
