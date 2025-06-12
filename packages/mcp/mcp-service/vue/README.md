# McpService Vue

提供 Vue 应用等快速用法

## 方法

### setupMcpService

初始化 McpService，并提供Vue依赖注入，返回 McpService 实例。

- **用法**

```javascript
// App。vue
const mcp = setupMcpService();
mcp.mcpServer.connect(...);
```

### useMcpService

自动注入 McpService， 并提供一个`tool`方法能自动章组件挂载和移除自动注册与移除

- **用法**

```javascript
// component.vue
const { tool } = useMcpService();
tool(...); //自动在组件挂载等时候注册工具，组件移除等时候移除工具
```

#### 返回值

mcp： McpService实例
tool： 工具注册方法，会自动加载时注册卸载时移除
