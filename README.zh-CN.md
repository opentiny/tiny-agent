## 本地开发

```sh
# 下载代码到本地
$ git clone git@github.com:opentiny/tiny-agent.git

# 安装所需的依赖
$ cd tiny-engine/ && pnpm install

# 启动
$ pnpm dev
```

打开浏览器访问： `http://localhost:5173/`

### 环境配置

```env
# demo-server/.env
# AI 平台 API 请求地址
url=
# AI 平台 API Key
apiKey=
# 使用的模型名称
model=
# 系统提示词
systemPrompt=You are a helpful assistant with access to tools.
```
