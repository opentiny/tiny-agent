import { addTwinkle, removeTwinkle } from '../common/addTwinkle';
import { addPopup } from '../index';
import '../assets/styles/guide.css';
import closeSvg from '../assets/images/close.svg?raw';

export default class GuideModal {
  private targetDom: HTMLElement;
  originOutlines: string;
  popupContent: HTMLDivElement;
  titleEl: HTMLHeadingElement;
  content: HTMLParagraphElement;
  closeIcon: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  arrow: HTMLDivElement;
  private onHideCallback: (() => void) | null = null;

  constructor(targetDom: HTMLElement) {
    this.targetDom = targetDom;
    this.originOutlines = targetDom.style.outline;
    this.popupContent = document.createElement('div');
    this.popupContent.className = 'ta-user-guide';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'ta-user-guide-title';

    this.content = document.createElement('div');
    this.content.className = 'ta-user-guide-content';

    this.closeIcon = document.createElement('div');
    this.closeIcon.innerHTML = closeSvg;
    this.closeIcon.className = 'close-icon';

    this.btnContainer = document.createElement('div');
    this.btnContainer.className = 'ta-user-guide-btn-container';
    this.nextButton = document.createElement('button');
    this.nextButton.textContent = '知道啦';
    this.nextButton.className = 'ta-user-guide-button';

    this.btnContainer.appendChild(this.nextButton);

    this.popupContent.appendChild(this.titleEl);
    this.popupContent.appendChild(this.content);
    this.popupContent.appendChild(this.closeIcon);
    this.popupContent.appendChild(this.btnContainer);

    this.closeIcon.addEventListener('click', () => {
      this.hide();
    });

    this.btnContainer.addEventListener('click', () => {
      this.hide();
    });
  }

  show({ title, text }: { title: string; text: string }) {
    this.targetDom && addTwinkle(this.targetDom);

    this.titleEl.textContent = title;
    this.content.textContent = text;

    this.popup = addPopup(this.targetDom, this.popupContent, {
      placement: 'bottom',
      closeOnClickOutside: false,
      closeOnEsc: false,
      triggerMode: 'manual', // 关键配置！使用手动触发模式
    });
    this.popup.show();
  }

  hide() {
    // this.targetDom.style.outline = this.originOutlines;
    console.log('hide');
    removeTwinkle(this.targetDom);
    this.popup.destroy();
    if (this.onHideCallback) {
      this.onHideCallback();
    }
  }

  onHide(callback: () => void) {
    this.onHideCallback = callback;
  }
}
