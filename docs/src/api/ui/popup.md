# Popup

根据目标元素位置创建弹出元素，可以控制弹出元素的显示与隐藏

- **用法**

```typescript
new Popup(reference, content, options);
```

- **参数说明**

  - `reference(HTMLElement)`: 引用元素，Popup 将跟随此元素

  - `content(HTMLElement | string)`: Popup 的内容

  - `options(object)`: Popup 的配置项，控制样式与交互

    - `placement('top' | 'right' | 'bottom' | 'left')`: 弹出框的位置
    - `offsetDistance(number)`: 与参考元素的距离，默认为 16
    - `showArrow(boolean)`: 是否显示箭头，默认为 true
    - `arrowSize(number)`: 箭头大小，默认为 8
    - `arrowColor(string)`: 箭头颜色，默认为 '#FFFFFF'
    - `className(string)`: 自定义类名
    - `zIndex(number)`: 层级，默认为 99999
    - `duration(number)`: 动画持续时间，默认为 200
    - `closeOnClickOutside(boolean)`: 点击外部是否关闭，默认为 true
    - `closeOnEsc(boolean)`: 按 ESC 键是否关闭，默认为 true
    - `triggerMode('click' | 'manual')`: 触发模式，默认为 'click'

- **示例**

```typescript
// 示例 1: 点击触发的 popup
const clickPopupBtn = document.getElementById('target-element');
if (clickPopupBtn) {
  const customContent = document.createElement('div');
  customContent.innerHTML =
    '<strong>点击触发的弹出内容</strong><p>点击外部区域关闭</p>';
  customContent.style.padding = '8px 0';

  const popup = new Popup(clickPopupBtn, customContent, {
    placement: 'bottom',
    showArrow: true,
    arrowColor: '#007bff',
    className: 'custom-popup',
    triggerMode: 'click', // 默认值，可省略
  });
}
```

```typescript
// 示例 2: 手动控制的 popup
const manualBtn = document.getElementById('target-element');
const ctrlPopupBtn = document.getElementById('ctrl-popup-btn');

if (manualBtn && ctrlPopupBtn) {
  const content = document.createElement('div');
  content.innerHTML =
    '<h4>手动控制的弹出框</h4><p>这个弹出框需要通过代码控制</p><button class="close-popup-btn">关闭</button>';

  // 创建手动控制的弹出框
  const popup = new Popup(manualBtn, content, {
    placement: 'right',
    closeOnClickOutside: false,
    closeOnEsc: true,
    triggerMode: 'manual', // 关键配置！使用手动触发模式
  });

  // 通过其他元素控制显示
  ctrlPopupBtn.addEventListener('click', () => {
    if (popup.isOpen()) {
      popup.show();
    } else {
      popup.hide();
    }
  });
}
```

## 方法

### destroy

用于销毁实例

- **详细信息**

  销毁 Popup 实例，清理所有事件监听器和 DOM 元素。

- **示例**

```typescript
const popup = new Popup(element, '内容');
popup.destroy();
```

### show

显示弹出框

- **详细信息**

  显示 Popup 实例，并自动处理位置计算和事件监听。

- **示例**

```typescript
const popup = new Popup(element, '内容');
popup.show();
```

### hide

隐藏弹出框

- **详细信息**

  隐藏 Popup 实例，并清理相关事件监听。

- **示例**

```typescript
const popup = new Popup(element, '内容');
popup.hide();
```

### toggle

切换显示/隐藏状态

- **详细信息**

  如果当前是显示状态则隐藏，如果是隐藏状态则显示。

- **示例**

```typescript
const popup = new Popup(element, '内容');
popup.toggle();
```

### isOpen

获取当前显示状态

- **详细信息**

  返回一个布尔值，表示 Popup 是否处于显示状态。

- **示例**

```typescript
const popup = new Popup(element, '内容');
const isVisible = popup.isOpen();
```
