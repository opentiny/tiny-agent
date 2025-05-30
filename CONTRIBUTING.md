# Contributing Guide

We're glad you're interested in contributing to the TinyAgent open-source project. There are many ways to contribute, and you can choose one or more based on your expertise and interests:

- Report [new bugs](https://github.com/opentiny/tiny-agent/issues/new?template=bug-report.yml)
- Provide more detailed information for [existing bugs](https://github.com/opentiny/tiny-agent/labels/bug), such as screenshots, detailed reproduction steps, or links to minimal reproducible demos
- Submit Pull requests to fix typos or improve documentation clarity

After using TinyAgent and participating in multiple contributions, as you become more familiar with TinyAgent, you can try more challenging tasks, such as:

- Fix bugs, starting with [Good-first issues](https://github.com/opentiny/tiny-agent/labels/good%20first%20issue)
- Implement new features
- Improve unit tests
- Translate documentation
- Participate in code reviews

## How to Submit an Issue

Thank you for using Tiny Agent! Before submitting an Issue, please confirm the following:

- You have carefully read the [Tiny Agent official documentation](https://opentiny.github.io/tiny-agent) and confirmed that the issue is not a usage question covered in the documentation.
- You have checked if the issue is already covered by [existing Issues](https://github.com/opentiny/tiny-agent/issues) to avoid duplicate submissions.

**Important Notes**

When submitting a bug report, please include the following information:

- **Clear and descriptive title**
- **Detailed description of the bug** (including any error messages)
- **Steps to reproduce**
- **Expected behavior**
- **Logs** (if applicable, especially important for backend issues, can be found in docker-compose logs)
- **Screenshots or videos** (if necessary)

### Our Priority Levels:

| **Issue Type**                                                | **Priority**                |
| ------------------------------------------------------------ | -------------------------- |
| Core functionality bugs (cloud service exceptions, login failures, application unusable, security vulnerabilities) | Critical                   |
| Non-critical bugs, performance optimization requests         | Medium Priority            |
| Minor fixes (typos, confusing but usable interfaces)         | Low Priority               |

## Submitting PRs

Before submitting a PR, please ensure that your contribution aligns with TinyAgent's overall planning. Issues marked as [bug](https://github.com/opentiny/tiny-agent/labels/bug) are generally encouraged for PR submissions. If you're unsure, you can create a [Discussion](https://github.com/opentiny/tiny-agent/discussions) for discussion.

### Pull Request Guidelines

#### Commit Messages

Commit messages should follow the format `type(scope): description`, for example `fix(mcp-connector): [endpoint] fix xxx bug`.

1. type: Must be one of build, chore, ci, docs, feat, fix, perf, refactor, revert, release, style, test, improvement.

2. scope:

- Package names under the `packages` directory, e.g.: `mcp, task, ui-components ......`
- Component names under packages in the `packages` directory, e.g.: `mcp/mcp-client-chat, task/task-action-lib ......`
- Folder names: e.g.: `gulp, internals/playwright-config, sites`

#### Pull Request Title

1. The title should follow the same format as commit messages: `type(scope): description`.

2. Title examples:

- Adding task module documentation: `docs(task): xxxxxxxxxxxxxxx`
- Adding task module test cases: `test(task): xxxxxxxxxxxxxx`
- Fixing bugs in @opentiny/tiny-agent-task-action-lib under task module (manually triggering e2e test cases): `fix(task/task-action-lib): xxxxxxxxxxxxxx`

#### Pull Request Description

PR descriptions use a template that requires filling in PR-related information, mainly including:

- PR self-check items: Whether commit messages follow the guidelines, whether E2E test cases are added, whether documentation is updated
- PR type: Bug fix, new feature, code formatting adjustment, refactoring, etc.
- Related Issue number
- Whether it contains breaking changes

### Local Setup Steps

- Click the Fork button in the top right corner of the [TinyAgent](https://github.com/opentiny/tiny-agent) repository to fork the upstream repository to your personal repository
- Clone your personal repository to local
- Link to the upstream repository for easy synchronization with the latest code
- Run `pnpm i` in the Tiny Agent root directory to install node dependencies
- Run `pnpm dev` to start the demo server and frontend project
- Open browser and visit: [http://localhost:5173/](http://localhost:5173/)

```shell
# Replace username with your username before executing
git clone git@github.com:username/tiny-agent.git
cd tiny-agent

# Link to upstream repository
git remote add upstream git@github.com:opentiny/tiny-agent.git

# Install dependencies
pnpm i

# Start demo project
pnpm dev
```

### Steps to Submit a PR

- Ensure you have completed the local setup steps and can access: [http://localhost:5173/](http://localhost:5173/)
- Sync with the latest code from upstream main branch: git pull upstream main
- Create a new branch from upstream main branch: `git checkout -b username/feature1 upstream/main`, branch name should be `username/feat-xxx` / `username/fix-xxx`
- Code locally
- Follow the [Commit Message Format](https://www.conventionalcommits.org/zh-hans/v1.0.0/) guidelines for commits. PRs that don't follow the commit guidelines won't be merged
- Push to remote repository: git push origin branchName
- Open the [Pull requests](https://github.com/opentiny/tiny-agent/pulls) link of the TinyAgent repository, click the New pull request button to submit PR
- Fill in the PR template with relevant information, including PR self-check items, PR type, related Issue number, and whether it contains breaking changes
- Project Committers will review the code and provide feedback
- PR author adjusts code based on feedback. Note that commits after a PR is submitted will automatically sync, no need to resubmit PR
- Project administrators merge PR

The contribution process is complete. Thank you for your contribution!

## Join the Open Source Community

If you have submitted an Issue or PR to OpenTiny, please add yourself to the contributors list using the following method:

```
@all-contributors please add @<username> for <contributions>
```

For detailed rules, please refer to: [https://allcontributors.org/docs/en/bot/usage](https://allcontributors.org/docs/en/bot/usage) 