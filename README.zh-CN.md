## 开发

### 安装所需的依赖

```sh
$ pnpm install
```

### 本地开发

#### 环境配置

```env
# demo-server/.env
# AI 平台 API 请求地址
url=https://openrouter.ai/api/v1/chat/completions
# AI 平台 API Key
apiKey=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
# 使用的模型名称
model=mistralai/mistral-7b-instruct:free
# 系统提示词
systemPrompt=You are a helpful assistant with access to tools.
```

#### 启动 demo 服务器

```sh
pnpm dev:demo-server
```

#### 启动 demo 前端工程

```sh
pnpm dev:demo
```

浏览器自动打开前端页面： `http://localhost:5173/`

### 参与贡献

如果你对我们的开源项目感兴趣，欢迎加入我们！🎉

参与贡献之前请先阅读[贡献指南](CONTRIBUTING.zh-CN.md)。
