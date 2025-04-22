export default class GuideModal {
  private targetDom: HTMLElement;
  originOutlines: string;
  modal: HTMLDivElement;
  title: HTMLHeadingElement;
  content: HTMLParagraphElement;
  closeButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  arrow: HTMLDivElement;
  private onHideCallback: (() => void) | null = null;

  constructor(targetDom: HTMLElement) {
    this.targetDom = targetDom;
    this.originOutlines = targetDom.style.outline;
    this.modal = document.createElement('div');
    this.setStyles(this.modal, {
      position: 'absolute',
      backgroundColor: 'white',
      boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)',
      padding: '20px',
      borderRadius: '4px',
      zIndex: '9999',
      display: 'none', // 初始化时设置为隐藏
      flexDirection: 'column',
      maxWidth: '300px',
    });

    this.title = document.createElement('h3');
    this.setStyles(this.title, {
      margin: '0 0 10px 0',
    });

    this.content = document.createElement('p');
    this.setStyles(this.content, {
      margin: '0 0 15px 0',
    });

    this.closeButton = document.createElement('button');
    this.closeButton.textContent = 'X';
    this.setStyles(this.closeButton, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
    });

    this.nextButton = document.createElement('button');
    this.nextButton.textContent = '知道啦';
    this.setStyles(this.nextButton, {
      alignSelf: 'flex-end',
      cursor: 'pointer',
      borderRadius: '14px',
      border: '1px solid #595959',
      fontSize: '14px',
      lineHeight: '14px',
      padding: '5px 10px',
      background: 'transparent',
    });

    // 创建箭头元素
    this.arrow = document.createElement('div');
    this.setStyles(this.arrow, {
      position: 'absolute',
      borderLeft: '10px solid transparent',
      borderRight: '10px solid transparent',
      borderBottom: '10px solid white',
      zIndex: '1001',
    });

    this.modal.appendChild(this.title);
    this.modal.appendChild(this.content);
    this.modal.appendChild(this.closeButton);
    this.modal.appendChild(this.nextButton);
    this.modal.appendChild(this.arrow);

    document.body.appendChild(this.modal);

    this.closeButton.addEventListener('click', () => {
      this.hide();
    });

    this.nextButton.addEventListener('click', () => {
      this.hide();
    });
  }

  setStyles(element: HTMLElement, styleObj: Record<string, string>) {
    for (let key in styleObj) {
      element.style[key as any] = styleObj[key];
    }
  }

  show({ title, text }: { title: string; text: string }) {
    const highlightedStyle = {
      outline: '2px solid #007bff',
    };
    this.targetDom && this.setStyles(this.targetDom, highlightedStyle);

    this.title.textContent = title;
    this.content.textContent = text;

    const rect = this.targetDom.getBoundingClientRect();
    let modalLeft = rect.left + rect.width / 2 - 25;
    let modalTop = rect.bottom + 10;

    // 检查弹框是否超出屏幕右侧
    if (modalLeft + 50 > window.innerWidth) {
      modalLeft = window.innerWidth - 50;
    }
    // 检查弹框是否超出屏幕底部
    if (modalTop + this.modal.offsetHeight > window.innerHeight) {
      modalLeft = rect.left + rect.width / 2 - 25;
      modalTop = rect.top - this.modal.offsetHeight - 10;
      // 调整箭头方向为向上
      this.setStyles(this.arrow, {
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '10px solid white',
        borderBottom: 'none',
        top: 'auto',
        bottom: '-10px',
      });
    } else {
      // 恢复箭头方向为向下
      this.setStyles(this.arrow, {
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderBottom: '10px solid white',
        borderTop: 'none',
        top: '-10px',
        bottom: 'auto',
      });
    }

    this.modal.style.left = `${modalLeft}px`;
    this.modal.style.top = `${modalTop}px`;
    // 定位箭头
    this.arrow.style.left = `${modalLeft + 20}px`;

    this.modal.style.display = 'flex';
  }

  hide() {
    this.targetDom.style.outline = this.originOutlines;
    this.modal.style.display = 'none';
    if (this.onHideCallback) {
      this.onHideCallback();
    }
  }

  onHide(callback: () => void) {
    this.onHideCallback = callback;
  }
}
