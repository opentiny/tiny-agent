import {
  FloatingContent,
  FloatingElement,
  FloatingElementOptions,
} from './float-element';

// Tooltip 特有选项
export interface TooltipOptions extends FloatingElementOptions {
  delay?: number; // 显示延迟
}

/**
 * Tooltip 实现类
 * 处理鼠标悬停触发的提示
 */
export class Tooltip extends FloatingElement {
  private showTimer: number | null = null;
  private handleMouseEnterFn: () => void;
  private handleMouseLeaveFn: () => void;

  constructor(
    reference: HTMLElement,
    content: FloatingContent,
    options: Partial<TooltipOptions> = {}
  ) {
    // 默认选项
    const defaultOptions: TooltipOptions = {
      placement: 'top',
      offsetDistance: 16,
      showArrow: true,
      arrowSize: 8,
      arrowColor: '#FFFFFF',
      className: '',
      zIndex: 99999,
      duration: 200,
      delay: 200,
    };

    // 合并选项
    super(reference, content, { ...defaultOptions, ...options });

    // 绑定事件处理方法到实例
    this.handleMouseEnterFn = this.handleMouseEnter.bind(this);
    this.handleMouseLeaveFn = this.handleMouseLeave.bind(this);

    // 添加事件监听器
    this.bindEvents();
  }

  /**
   * 绑定事件监听器
   */
  private bindEvents(): void {
    this.reference.addEventListener('mouseenter', this.handleMouseEnterFn);
    this.reference.addEventListener('mouseleave', this.handleMouseLeaveFn);
    this.reference.addEventListener('focus', this.handleMouseEnterFn);
    this.reference.addEventListener('blur', this.handleMouseLeaveFn);
  }

  /**
   * 解绑事件监听器
   */
  private unbindEvents(): void {
    this.reference.removeEventListener('mouseenter', this.handleMouseEnterFn);
    this.reference.removeEventListener('mouseleave', this.handleMouseLeaveFn);
    this.reference.removeEventListener('focus', this.handleMouseEnterFn);
    this.reference.removeEventListener('blur', this.handleMouseLeaveFn);
  }

  private handleMouseEnter(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
    }
    this.showTimer = setTimeout(() => {
      this.show();
    }, (this.options as TooltipOptions).delay);
  }

  private handleMouseLeave(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    this.hide();
  }

  public destroy(): void {
    this.unbindEvents();

    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    super.destroy();
  }
}

/**
 * 创建Tooltip的便捷函数
 */
export function addTooltip(
  reference: HTMLElement,
  content: FloatingContent,
  options: Partial<TooltipOptions> = {}
): Tooltip {
  return new Tooltip(reference, content, options);
}
