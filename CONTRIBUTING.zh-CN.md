# 贡献指南

很高兴你有意愿参与 TinyAgent 开源项目的贡献，参与贡献的形式有很多种，你可以根据自己的特长和兴趣选择其中的一个或多个：

- 报告[新缺陷](https://github.com/opentiny/tiny-agent/issues/new?template=bug-report.yml)
- 为[已有缺陷](https://github.com/opentiny/tiny-agent/labels/bug)提供更详细的信息，比如补充截图、提供更详细的复现步骤、提供最小可复现 demo 链接等
- 提交 Pull requests 修复文档中的错别字或让文档更清晰和完善

当你亲自使用 TinyAgent，并参与多次以上形式的贡献，对 TinyAgent 逐渐熟悉之后，可以尝试做一些更有挑战的事情，比如：

- 修复缺陷，可以先从 [Good-first issue](https://github.com/opentiny/tiny-agent/labels/good%20first%20issue) 开始
- 实现新特性
- 完善单元测试
- 翻译文档
- 参与代码检视

## 如何提交 Issue

感谢您使用 Tiny Agent！在提交 Issue 前，请先确认以下内容：

已仔细阅读 [Tiny Agent 官方文档](https://opentiny.github.io/tiny-agent)，确认问题不是文档未覆盖的使用疑问。

已检查该问题是否已被 [现有 Issue](https://github.com/opentiny/tiny-agent/issues) 覆盖，避免重复提交。

**重要提示**

提交缺陷报告时，请务必包含以下信息：

- **清晰且具描述性的标题**
- **缺陷的详细描述**（包括任何错误信息）
- **复现步骤**
- **预期行为**
- **日志**（如适用，对于后端问题尤为重要，可在 docker-compose logs 中查找）
- **截图或视频**（如有必要）

### 我们的优先级划分：

| **问题类型**                                                 | **优先级**                 |
| ------------------------------------------------------------ | -------------------------- |
| 核心功能缺陷（云服务异常、无法登录、应用无法使用、安全漏洞） | 紧急 Critical              |
| 非关键缺陷、性能优化请求                                     | 中等优先级 Medium Priority |
| 微小修复（拼写错误、存在混淆但可用的界面）                   | 低优先级 Low Priority      |

## 提交 PR

提交 PR 之前，请先确保你提交的内容是符合 TinyAgent 整体规划的，一般已经标记为 [bug](https://github.com/opentiny/tiny-agent/labels/bug) 的 Issue 是鼓励提交 PR 的，如果你不是很确定，可以创建一个 [Discussion](https://github.com/opentiny/tiny-agent/discussions) 进行讨论。

### Pull Request 规范

#### Commit 信息

commit 信息要以 `type(scope): 描述信息` 的形式填写，例如 `fix(mcp-connector): [endpoint] fix xxx bug`。

1. type: 必须是 build, chore, ci, docs, feat, fix, perf, refactor, revert, release, style, test, improvement 其中的一个。

2. scope:

- `packages`目录下的包名，比如：`mcp, task, ui-components ......`
- `packages`目录下的包名下的组件名，比如：`mcp/mcp-client-chat, task/task-action-lib ......`
- 用文件夹的名称: 比如: `gulp, internals/playwright-config, sites`

#### Pull Request 的标题

1. 标题的规范与 commit 信息一样，以`type(scope): 描述信息` 的形式填写。

2. 标题示例:

- 补充 task 模块文档： `docs(补充task文档：): xxxxxxxxxxxxxxx`
- 补充 task 模块测试用例: `test(task): xxxxxxxxxxxxxx`
- 修复 task 模块 @opentiny/tiny-agent-task-action-lib 下的缺陷（手动触发 e2e 测试用例）: `fix(task/task-action-lib): xxxxxxxxxxxxxx`

#### Pull Request 的描述

PR 描述使用了模板，需要按照模板填写 PR 相关信息，主要包括：

- PR 自检项：Commit 信息是够符合规范、是否补充了 E2E 测试用例、是否补充了文档
- PR 类型：缺陷修复、新特性、代码格式调整、重构等
- 关联的 Issue 编号
- 是否包含破坏性变更

### 本地启动步骤

- 点击 [TinyAgent](https://github.com/opentiny/tiny-agent) 代码仓库右上角的 Fork 按钮，将上游仓库 Fork 到个人仓库
- Clone 个人仓库到本地
- 关联上游仓库，方便同步上游仓库最新代码
- 在 Tiny Agent 根目录下运行 `pnpm i`, 安装 node 依赖
- 运行 `pnpm dev`，启动 demo 服务器以及前端工程
- 打开浏览器访问：[http://localhost:5173/](http://localhost:5173/)

```shell
# username 为用户名，执行前请替换
git clone git@github.com:username/tiny-agent.git
cd tiny-agent

# 关联上游仓库
git remote add upstream git@github.com:opentiny/tiny-agent.git

# 安装依赖
pnpm i

# 启动 demo项目
pnpm dev
```

### 提交 PR 的步骤

- 请确保你已经完成本地启动中的步骤，并能正常访问：[http://localhost:5173/](http://localhost:5173/)
- 同步上游仓库 main 分支最新代码：git pull upstream main
- 从上游仓库 main 分支创建新分支 `git checkout -b username/feature1 upstream/main`，分支名字建议为 `username/feat-xxx` / `username/fix-xxx`
- 本地编码
- 遵循 [Commit Message Format](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范进行提交，不符合提交规范的 PR 将不会被合并
- 提交到远程仓库：git push origin branchName
- 打开 TinyAgent 代码仓库的 [Pull requests](https://github.com/opentiny/tiny-agent/pulls) 链接，点击 New pull request 按钮提交 PR
- 按照 PR 模板补充相关信息，包括 PR 自检项、PR 类型、关联的 Issue 编号、是否是破坏性变更
- 项目 Committer 进行 Code Review，并提出意见
- PR 作者根据意见调整代码，请注意一个分支发起了 PR 后，后续的 commit 会自动同步，无需重新提交 PR
- 项目管理员合并 PR

贡献流程结束，感谢你的贡献！

## 加入开源社区

如果你给 OpenTiny 提交过 Issue 或 PR，请通过以下方式添加自己到贡献者列表里。

```
@all-contributors please add @<username> for <contributions>
```

详细规则可以参考：[https://allcontributors.org/docs/en/bot/usage](https://allcontributors.org/docs/en/bot/usage)
