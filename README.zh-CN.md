<p align="center">
  <a href="" target="_blank" rel="noopener noreferrer">
    <img alt="OpenTiny TinyAgent Logo" src="./docs/src/public/logo.svg" height="100" style="max-width:100%;vertical-align: middle">
    <span style="font-size: 36px; vertical-align: middle; margin-left: 24px">OpenTiny TinyAgent</span>
  </a>
</p>
<p align="center"> 基于MCP协议使AI理解与操作用户界面，完成用户任务。</p>

[English](README.md) | 简体中文

## 🌈 特性

- **支持MCP协议** 支持MCP客户端 + FunctionCall/ReAct模式的大模型
- **任务调度指令** 支持模拟人机交互，让AI操作用户界面，可人为干预
- **可扩展操作哭** 丰富的人机交互模拟，支持组件模块API专有扩展
- **开发工具套件** 轻松标记编排，生成AI能理解的网站使用说明书


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