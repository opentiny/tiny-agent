# Tooltip

根据目标元素位置创建提示元素，当鼠标悬停或获得焦点时显示提示内容

- **用法**

```typescript
new Tooltip(reference, content, options);
```

- **参数说明**

  - `reference(HTMLElement)`: 引用元素，Tooltip 将跟随此元素

  - `content(HTMLElement | string)`: Tooltip 的内容

  - `options(object)`: Tooltip 的配置项，控制样式与交互

    - `placement('top' | 'right' | 'bottom' | 'left')`: 提示框的位置
    - `offsetDistance(number)`: 与参考元素的距离，默认为 16
    - `showArrow(boolean)`: 是否显示箭头，默认为 true
    - `arrowSize(number)`: 箭头大小，默认为 8
    - `arrowColor(string)`: 箭头颜色，默认为 '#FFFFFF'
    - `className(string)`: 自定义类名
    - `zIndex(number)`: 层级，默认为 99999
    - `duration(number)`: 动画持续时间，默认为 200
    - `delay(number)`: 显示延迟时间，默认为 200

- **示例**

```typescript
const tooltipBtn = document.getElementById('target-element');
if (tooltipBtn) {
  const tooltip = new Tooltip(tooltipBtn, '这是一个提示内容', {
    placement: 'top',
    showArrow: true,
    arrowColor: '#007bff',
    className: 'custom-tooltip',
  });
}
```

## 方法

### destroy

用于销毁实例

- **详细信息**

  销毁 Tooltip 实例，清理所有事件监听器和 DOM 元素。

- **示例**

```typescript
const tooltip = new Tooltip(element, '内容');
tooltip.destroy();
```

### show

显示提示框

- **详细信息**

  显示 Tooltip 实例，并自动处理位置计算。

- **示例**

```typescript
const tooltip = new Tooltip(element, '内容');
tooltip.show();
```

### hide

隐藏提示框

- **详细信息**

  隐藏 Tooltip 实例。

- **示例**

```typescript
const tooltip = new Tooltip(element, '内容');
tooltip.hide();
```
