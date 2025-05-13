import {
  computePosition,
  autoUpdate,
  offset,
  shift,
  flip,
  arrow,
  Placement,
  ComputePositionReturn,
} from '@floating-ui/dom';

// 类型定义
type FloatingContent = string | HTMLElement;

// 基础浮动元素选项接口
interface FloatingElementOptions {
  placement?: Placement;
  offsetDistance?: number;
  showArrow?: boolean;
  arrowSize?: number;
  arrowColor?: string;
  className?: string;
  zIndex?: number;
  duration?: number;
}

// Tooltip 特有选项
interface TooltipOptions extends FloatingElementOptions {
  delay?: number; // 显示延迟
}

// Popup 特有选项
interface PopupOptions extends FloatingElementOptions {
  closeOnClickOutside?: boolean; // 点击外部关闭
  closeOnEsc?: boolean; // 按ESC关闭
  triggerMode?: 'click' | 'manual'; // 触发模式：点击或手动
}

/**
 * 基础浮动元素类
 * 为 Tooltip 和 Popup 提供共同的基础功能
 */
class FloatingElement {
  protected reference: HTMLElement;
  protected content: FloatingContent;
  protected options: FloatingElementOptions;
  protected element: HTMLElement | null = null;
  protected arrowElement: HTMLElement | null = null;
  protected cleanupAutoUpdate: (() => void) | null = null;
  protected hideTimeout: number | null = null;

  constructor(
    reference: HTMLElement,
    content: FloatingContent,
    options: FloatingElementOptions
  ) {
    this.reference = reference;
    this.content = content;
    this.options = options;

    // 创建浮动元素
    this.createElement();
  }

  /**
   * 创建浮动元素
   */
  protected createElement(): void {
    const elementStyle = {
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      color: '#333',
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: '14px',
      zIndex: `${this.options.zIndex}`,
      opacity: '0',
      visibility: 'hidden',
      transition: `opacity ${this.options.duration}ms ease-in-out, visibility ${this.options.duration}ms ease-in-out`,
      boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
    };

    const arrowStyle = {
      position: 'absolute',
      width: `${this.options.arrowSize}px`,
      height: `${this.options.arrowSize}px`,
      backgroundColor: this.options.arrowColor || '#FFFFFF',
      transform: 'rotate(45deg)',
      zIndex: '-1',
    };
    // 创建主元素
    this.element = document.createElement('div');
    this.element.setAttribute('role', 'popup');
    Object.assign(this.element.style, elementStyle);

    if (this.options.className) {
      this.element.className = this.options.className;
    }

    // 创建箭头元素
    if (this.options.showArrow) {
      this.arrowElement = document.createElement('div');
      Object.assign(this.arrowElement.style, arrowStyle);
      this.element.appendChild(this.arrowElement);
    }

    // 设置内容
    if (typeof this.content === 'string') {
      const textNode = document.createTextNode(this.content);
      this.element.appendChild(textNode);
    } else {
      this.element.appendChild(this.content);
    }
  }

  /**
   * 显示浮动元素
   */
  public show(): void {
    if (!this.element) return;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // 如果浮动元素不在 DOM 中，添加它
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }

    // 设置初始位置，防止闪烁
    this.element.style.left = '0';
    this.element.style.top = '0';

    // 启动位置更新
    this.cleanupAutoUpdate = autoUpdate(this.reference, this.element, () =>
      this.update()
    );

    // 显示浮动元素
    setTimeout(() => {
      if (this.element) {
        this.element.style.opacity = '1';
        this.element.style.visibility = 'visible';
      }
    }, 10);
  }

  public hide(): void {
    if (!this.element) return;

    this.element.style.opacity = '0';
    this.element.style.visibility = 'hidden';

    this.hideTimeout = window.setTimeout(() => {
      if (this.element && this.element.parentNode) {
        document.body.removeChild(this.element);
      }
      if (this.cleanupAutoUpdate) {
        this.cleanupAutoUpdate();
        this.cleanupAutoUpdate = null;
      }
    }, this.options.duration);
  }

  public async update(): Promise<void> {
    if (!this.element) return;

    const middlewareArray = [
      offset(this.options.offsetDistance),
      flip(),
      shift({ padding: 5 }),
    ];

    if (this.arrowElement && this.options.showArrow) {
      middlewareArray.push(arrow({ element: this.arrowElement }));
    }

    const computedPosition = await computePosition(
      this.reference,
      this.element,
      {
        placement: this.options.placement,
        middleware: middlewareArray,
      }
    );

    this.positionElement(computedPosition);
  }

  /**
   * 设置浮动元素位置
   */
  protected positionElement(position: ComputePositionReturn): void {
    if (!this.element) return;

    const { x, y, placement, middlewareData } = position;

    Object.assign(this.element.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    // 处理箭头位置
    if (this.arrowElement && middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow;

      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]] as string;

      Object.assign(this.arrowElement.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
        [staticSide]: `${-this.options.arrowSize! / 2}px`,
      });
    }
  }

  public destroy(): void {
    if (this.cleanupAutoUpdate) {
      this.cleanupAutoUpdate();
      this.cleanupAutoUpdate = null;
    }

    if (this.element && this.element.parentNode) {
      document.body.removeChild(this.element);
      this.element = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

/**
 * Tooltip 实现类
 * 处理鼠标悬停触发的提示
 */
export class Tooltip extends FloatingElement {
  private showTimeout: number | null = null;

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
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);

    // 添加事件监听器
    this.bindEvents();
  }

  /**
   * 绑定事件监听器
   */
  private bindEvents(): void {
    this.reference.addEventListener('mouseenter', this.handleMouseEnter);
    this.reference.addEventListener('mouseleave', this.handleMouseLeave);
    this.reference.addEventListener('focus', this.handleMouseEnter);
    this.reference.addEventListener('blur', this.handleMouseLeave);
  }

  /**
   * 解绑事件监听器
   */
  private unbindEvents(): void {
    this.reference.removeEventListener('mouseenter', this.handleMouseEnter);
    this.reference.removeEventListener('mouseleave', this.handleMouseLeave);
    this.reference.removeEventListener('focus', this.handleMouseEnter);
    this.reference.removeEventListener('blur', this.handleMouseLeave);
  }

  private handleMouseEnter(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    this.showTimeout = window.setTimeout(() => {
      this.show();
    }, (this.options as TooltipOptions).delay);
  }

  private handleMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hide();
  }

  public destroy(): void {
    this.unbindEvents();

    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    super.destroy();
  }
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
    this.handleClick = this.handleClick.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleEscKey = this.handleEscKey.bind(this);

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
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside);
      }, 0);
    }

    if (this.closeOnEsc) {
      document.addEventListener('keydown', this.handleEscKey);
    }
  }

  /**
   * 重写隐藏方法，移除事件监听
   */
  public hide(): void {
    super.hide();
    this.isShown = false;

    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleEscKey);
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
      this.reference.removeEventListener('click', this.handleClick);
    }

    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleEscKey);

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
