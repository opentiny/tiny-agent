## 简介

本库是一个用于模拟前端用户操作的工具库，支持表单输入、下拉选择、单选复选框操作、路由跳转、DOM 操作等多种功能。通过定义不同的 `Action`，可以方便地实现各种复杂的自动化操作流程。

## 功能特性

- **表单操作**：模拟用户在输入框、单选框、复选框、下拉列表和提交按钮上的操作。
- **路由操作**：支持 Vue Router 的路由跳转、替换、前进和后退操作。
- **DOM 操作**：提供高亮元素、插入前置元素、滚动到元素、点击、双击、右键点击等 DOM 操作。

## 操作类型

### 表单操作 (FormActions)

- **INPUT：** 模拟用户在输入框中输入文本。
- **RADIO：** 模拟用户选择单选按钮。
- **CHECKBOX：** 模拟用户选择复选框。
- **SELECT：** 模拟用户选择下拉列表选项。
- **SUBMIT：** 模拟用户点击提交按钮。

### 路由操作 (VueRouterActions)

- **VUE_PUSH：** 使用 Vue Router 进行路由跳转。
- **VUE_REPLACE：** 使用 Vue Router 替换当前路由。
- **VUE_GO_BACK：** 使用 Vue Router 后退。
- **VUE_GO_FORWARD：** 使用 Vue Router 前进。
- **VUE_GO：** 使用 Vue Router 前进或后退指定步数。

### DOM 操作 (DomActions)

- **HIGHLIGHT：** 高亮指定元素。
- **INSERT_BEFORE：** 在指定元素前插入新元素。
- **SCROLL_TO：** 滚动到指定元素。
- **CLICK：** 点击指定元素。
- **DOUBLE_CLICK：** 双击指定元素。
- **RIGHT_CLICK：** 右键点击指定元素。
- **GO_BACK：** 使用浏览器历史记录后退。
- **GO_FORWARD：** 使用浏览器历史记录前进。
- **FIND_DOM：** 查找指定 DOM 元素。

### floatElement

#### 添加 tooltip

```js
// 示例1: 简单文本 tooltip
const tooltipBtn = document.getElementById('tooltip-btn');
if (tooltipBtn) {
  const tooltip = addTooltip(tooltipBtn, '这是一个简单的文本提示');

  // 可以稍后通过 tooltip.destroy() 移除
}
```

#### 添加 popup

```js
// 示例 2: 点击触发的 popup
const clickPopupBtn = document.getElementById('click-popup-btn');
if (clickPopupBtn) {
  const customContent = document.createElement('div');
  customContent.innerHTML =
    '<strong>点击触发的弹出内容</strong><p>点击外部区域关闭</p>';
  customContent.style.padding = '5px';

  const popup = addPopup(clickPopupBtn, customContent, {
    placement: 'bottom',
    showArrow: true,
    arrowColor: '#007bff',
    className: 'custom-popup',
    triggerMode: 'click', // 默认值，可省略
  });

  // 可以通过 popup.isOpen() 检查状态
  // 可以通过 popup.destroy() 移除
}
```

#### 手动控制的 popup

```js
// 示例 3: 手动控制的 popup
const manualBtn = document.getElementById('manual-btn');
const openPopupBtn = document.getElementById('open-popup-btn');
const closePopupBtn = document.getElementById('close-popup-btn');

if (manualBtn && openPopupBtn) {
  const content = document.createElement('div');
  content.innerHTML =
    '<h4>手动控制的弹出框</h4><p>这个弹出框需要通过代码控制</p><button id="close-popup-btn">关闭</button>';

  // 创建手动控制的弹出框
  const popup = addPopup(manualBtn, content, {
    placement: 'right',
    closeOnClickOutside: false,
    closeOnEsc: true,
    triggerMode: 'manual', // 关键配置！使用手动触发模式
  });

  // 通过其他元素控制显示
  openPopupBtn.addEventListener('click', () => {
    popup.show();
  });

  // 找到关闭按钮并添加事件
  setTimeout(() => {
    const closeBtn = document.getElementById('close-popup-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        popup.hide();
      });
    }
  }, 100);
}
```
