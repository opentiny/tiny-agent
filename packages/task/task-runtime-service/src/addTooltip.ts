import {
  computePosition,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/dom';

interface TooltipOptions {
  placement: 'top' | 'bottom' | 'left' | 'right';
  content: string;
}

class TooltipController {
  private trigger: HTMLElement;
  private tooltip: HTMLElement;
  private cleanup?: () => void;
  private text: string;

  constructor(trigger: HTMLElement, text) {
    this.trigger = trigger;
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';

    this.setStyles(this.tooltip, {
      position: 'fixed',
      backgroundColor: 'white',
      boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)',
      padding: '8px 12px',
      borderRadius: '4px',
      zIndex: '19999',
      display: 'none', // 初始化时设置为隐藏
      flexDirection: 'column',
      maxWidth: '300px',
    });
    document.body.appendChild(this.tooltip);
    this.text = text || this.trigger.dataset.tooltip || '';
    this.init();
  }

  private init() {
    const options: TooltipOptions = {
      placement: (this.trigger.dataset.placement || 'top') as any,
      content: this.text || '',
    };

    // 设置 Tooltip 内容
    this.tooltip.textContent = this.text;
    // 事件监听
    this.trigger.addEventListener('mouseenter', () => this.show());
    this.trigger.addEventListener('focus', () => this.show());
    this.trigger.addEventListener('mouseleave', () => this.hide());
    this.trigger.addEventListener('blur', () => this.hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });

    // 初始化时隐藏
    this.hide();
  }

  setStyles(element: HTMLElement, styleObj: Record<string, string>) {
    for (let key in styleObj) {
      element.style[key as any] = styleObj[key];
    }
  }

  private async show() {
    this.tooltip.style.display = 'block'; // 显示 Tooltip
    // 计算位置
    const updatePosition = async () => {
      const { x, y } = await computePosition(this.trigger, this.tooltip, {
        placement: (this.trigger.dataset.placement || 'top') as any,
        middleware: [
          offset(8), // 与触发元素的间距
          flip(), // 自动翻转位置
          shift(), // 避免超出视口
        ],
      });

      Object.assign(this.tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    };

    // 动态更新位置
    this.cleanup = autoUpdate(this.trigger, this.tooltip, updatePosition);
    await updatePosition();
  }

  private hide() {
    this.tooltip.style.display = 'none';
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = undefined;
    }
  }

  // 清理
  destroy() {
    this.hide();
    this.tooltip.remove();
    this.trigger.removeEventListener('mouseenter', () => this.show());
    this.trigger.removeEventListener('focus', () => this.show());
    this.trigger.removeEventListener('mouseleave', () => this.hide());
    this.trigger.removeEventListener('blur', () => this.hide());
  }
}

let tooltip;

export const addTooltip = (trigger: HTMLElement, text) => {
  if (trigger instanceof HTMLElement) {
    tooltip = new TooltipController(trigger, text);
  }
};

export const removeTooltip = (trigger: HTMLElement) => {
  if (tooltip) {
    tooltip.destroy();
    tooltip = undefined;
  }
};
