import {
  FloatingContent,
  FloatingElement,
  FloatingElementOptions,
} from './float-element';

// Popup 特有选项
export interface PopupOptions extends FloatingElementOptions {
  closeOnClickOutside?: boolean; // 点击外部关闭
  closeOnEsc?: boolean; // 按ESC关闭
  triggerMode?: 'click' | 'manual'; // 触发模式：点击或手动
}
/**
 * Popup 实现类
 * 处理点击触发或手动控制的弹出框
 */
export class Popup extends FloatingElement {
  private isShown: boolean = false;
  private triggerMode: 'click' | 'manual';
  private closeOnClickOutside: boolean;
  private closeOnEsc: boolean;
  private handleClickOutsideFn: (event: MouseEvent) => void;
  private handleEscKeyFn: (event: KeyboardEvent) => void;
  private handleClickFn: (event: MouseEvent) => void;

  constructor(
    reference: HTMLElement,
    content: FloatingContent,
    options: Partial<PopupOptions> = {}
  ) {
    // 默认选项
    const defaultOptions: PopupOptions = {
      placement: 'top',
      offsetDistance: 16,
      showArrow: true,
      arrowSize: 8,
      arrowColor: '#FFFFFF',
      className: '',
      zIndex: 99999,
      duration: 200,
      closeOnClickOutside: true,
      closeOnEsc: true,
      triggerMode: 'click',
    };

    // 合并选项
    const mergedOptions = { ...defaultOptions, ...options };
    super(reference, content, mergedOptions);

    // 保存特有选项
    this.triggerMode = mergedOptions.triggerMode!;
    this.closeOnClickOutside = mergedOptions.closeOnClickOutside!;
    this.closeOnEsc = mergedOptions.closeOnEsc!;

    // 绑定事件处理方法到实例
    this.handleClickOutsideFn = this.handleClickOutside.bind(this);
    this.handleEscKeyFn = this.handleEscKey.bind(this);
    this.handleClickFn = this.handleClick.bind(this);

    // 如果是点击触发模式，绑定点击事件
    if (this.triggerMode === 'click') {
      this.reference.addEventListener('click', this.handleClick);
    }
  }

  /**
   * 切换显示/隐藏状态
   */
  public toggle(): void {
    if (this.isShown) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 重写显示方法，添加事件监听
   */
  public show(): void {
    super.show();
    this.isShown = true;

    if (this.closeOnClickOutside) {
      this.clickOutsideTimer = setTimeout(() => {
        document.addEventListener('click', this.handleClickOutsideFn);
        this.clickOutsideTimer = null;
      }, 0);
    }

    if (this.closeOnEsc) {
      document.addEventListener('keydown', this.handleEscKeyFn);
    }
  }

  /**
   * 重写隐藏方法，移除事件监听
   */
  public hide(): void {
    super.hide();
    this.isShown = false;

    document.removeEventListener('click', this.handleClickOutsideFn);
    document.removeEventListener('keydown', this.handleEscKeyFn);
  }

  /**
   * 处理点击事件（仅点击触发模式）
   */
  private handleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggle();
  }

  /**
   * 处理点击外部事件
   */
  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      this.isShown &&
      !this.reference.contains(target) &&
      this.element &&
      !this.element.contains(target)
    ) {
      this.hide();
    }
  }

  /**
   * 处理ESC键事件
   */
  private handleEscKey(event: KeyboardEvent): void {
    if (this.isShown && event.key === 'Escape') {
      this.hide();
    }
  }

  /**
   * 获取当前是否显示
   */
  public isOpen(): boolean {
    return this.isShown;
  }

  /**
   * 重写销毁方法，清理特有事件
   */
  public destroy(): void {
    if (this.triggerMode === 'click') {
      this.reference.removeEventListener('click', this.handleClickFn);
    }

    document.removeEventListener('click', this.handleClickOutsideFn);
    document.removeEventListener('keydown', this.handleEscKeyFn);

    if (this.clickOutsideTimer) {
      clearTimeout(this.clickOutsideTimer);
      this.clickOutsideTimer = null;
    }

    super.destroy();
  }
}

/**
 * 创建Popup的便捷函数
 */
export function addPopup(
  reference: HTMLElement,
  content: FloatingContent,
  options: Partial<PopupOptions> = {}
): Popup {
  return new Popup(reference, content, options);
}
