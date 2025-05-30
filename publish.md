## 构建与发布

**构建packages目录下所有包**

```bash
pnpm build
```

**更新包版本**

运行updateVersion 后面带版本号

```bash
pnpm updateVersion 0.0.3
```

**批量发布**

```bash
pnpm pub
```

npm unpublish gimmytest-tiny-agent-mcp-connector --force
npm unpublish gimmytest-tiny-agent-ui-components --force
npm unpublish gimmytest-tiny-agent-task-runtime-service --force
npm unpublish gimmytest-tiny-agent-task-action-lib --force
