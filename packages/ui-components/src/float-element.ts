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
export type FloatingContent = string | HTMLElement;

// 基础浮动元素选项接口
export interface FloatingElementOptions {
  placement?: Placement;
  offsetDistance?: number;
  showArrow?: boolean;
  arrowSize?: number;
  arrowColor?: string;
  className?: string;
  zIndex?: number;
  duration?: number;
}

/**
 * 基础浮动元素类
 * 为 Tooltip 和 Popup 提供共同的基础功能
 */
export class FloatingElement {
  protected reference: HTMLElement;
  protected content: FloatingContent;
  protected options: FloatingElementOptions;
  protected element: HTMLElement | null = null;
  protected arrowElement: HTMLElement | null = null;
  protected cleanupAutoUpdate: (() => void) | null = null;
  protected hideTimer: number | null = null;
  protected clickOutsideTimer: number | null = null;

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

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
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

    this.hideTimer = setTimeout(() => {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      if (this.cleanupAutoUpdate) {
        this.cleanupAutoUpdate();
        this.cleanupAutoUpdate = null;
      }
      this.hideTimer = null;
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

    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
