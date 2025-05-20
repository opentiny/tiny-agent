# 一、GitHub 风格的提示信息

> [!NOTE]
> 强调用户在快速浏览文档时也不应忽略的重要信息。

> [!TIP]
> 有助于用户更顺利达成目标的建议性信息。

> [!IMPORTANT]
> 对用户达成目标至关重要的信息。

> [!WARNING]
> 因为可能存在风险，所以需要用户立即关注的关键内容。

> [!CAUTION]
> 行为可能带来的负面影响。

# 二、代码展示

## 2.1 默认展开代码

```ts
const a = 1;
console.log(a);
```

## 2.2 默认折叠代码

::: details 点我查看代码

```js
console.log('Hello, TinyAgent!');
```

:::

## 2.3 引入 vue 文件 demo 案例

<demo vue="../../demos/animation/start-light.vue" />

# 三、跳转

[跳到根目录](/) <!-- 将用户导航至根目录下的 index.html -->

[跳到扩展目录](/extensions/simulate-lib) <!-- 将用户导航至目录 foo 下的 index.html -->

[跳到指定锚点](./#_2-1-默认展开代码) <!-- 将用户锚定到目录 foo 下的index文件中的一个标题上 -->

[查看版本更新](../releases/releases) <!-- 可以省略扩展名 -->

[外链](https://vitepress.dev/zh/guide/markdown)

# 更多使用方式

参考 [vitepress 官网](https://vitepress.dev/zh/guide/markdown)
