import EventEmitter from './eventEmitter';
import {
  addBreathe,
  removeBreathe,
  addTooltip,
} from '@opentiny/tiny-agent-task-action-lib';

import skip from './assets/images/skip.svg?url';
import skipDisabled from './assets/images/skip-disabled.svg?url';
import pause from './assets/images/pause.svg?url';
import resume from './assets/images/resume.svg?url';
import stop from './assets/images/stop.svg?url';
import stopDisabled from './assets/images/stop-disabled.svg?url';

// UI运行状态 TODO: 需要扩展loading状态
export enum Status {
  Stop = 'stop',
  Running = 'running',
  Paused = 'paused',
}

const titleStyles = {
  fontSize: '14px',
  color: '#191919',
  width: '180px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const createImg = (src: string) => {
  const img = document.createElement('img');
  img.src = src;
  Object.assign(img.style, {
    width: '24px',
    height: '24px',
    marginLeft: '12px',
    cursor: 'pointer',
    borderRadius: '50%',
  });
  return img;
};

export class SchedulerUI extends EventEmitter {
  messageBox: HTMLDivElement;
  titleElm!: HTMLDivElement;
  pauseBtn!: HTMLImageElement;
  skipBtn!: HTMLImageElement;
  skipDisabledBtn!: HTMLImageElement;
  stopBtn!: HTMLImageElement;
  stopDisabledBtn!: HTMLImageElement;
  resumeBtn!: HTMLImageElement;
  light: HTMLDivElement;
  titleTooltip: { destroy: () => void } | null = null;
  pauseTooltip: { destroy: () => void } | null = null;

  constructor({ title }: { title: string }) {
    super();
    this.light = this.createBreathingLight();
    this.messageBox = this.createMessageBox();
    this.init({ title });
  }

  private createMessageBox() {
    const box = document.createElement('div');
    const boxStyles = {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      padding: '0 24px',
      backgroundColor: 'white',
      borderRadius: '27px',
      boxShadow: '0 2px 40px rgba(0, 0, 0, 0.16)',
      height: '54px',
      display: 'flex',
      alignItems: 'center',
      zIndex: '10000',
    };
    Object.assign(box.style, boxStyles);
    document.body.appendChild(box);
    return box;
  }

  private init({ title }: { title: string }) {
    this.titleElm = document.createElement('div');
    Object.assign(this.titleElm.style, titleStyles);
    this.setTitle(title);

    this.skipBtn = createImg(skip);
    this.skipBtn.onclick = () => this.skip(true);
    this.skipBtn.title = '跳过';

    this.skipDisabledBtn = createImg(skipDisabled);
    this.skipDisabledBtn.style.cursor = 'not-allowed';

    this.stopBtn = createImg(stop);
    this.stopBtn.onclick = () => this.stop(true);
    this.stopBtn.title = '停止';

    this.stopDisabledBtn = createImg(stopDisabled);
    this.stopDisabledBtn.style.cursor = 'not-allowed';

    this.pauseBtn = createImg(pause);
    this.pauseBtn.onclick = () => this.pause(true);
    this.pauseBtn.title = '暂停';

    this.resumeBtn = createImg(resume);
    this.resumeBtn.onclick = () => this.resume(true);
    this.resumeBtn.title = '恢复';

    this.messageBox.append(
      this.titleElm,
      this.skipDisabledBtn,
      this.pauseBtn,
      this.stopBtn
    );

    this.hide(); // 初始化时隐藏
  }

  setTitle(title: string) {
    if (this.titleElm) {
      this.titleElm.textContent = title;
      Promise.resolve().then(() => {
        if (this.titleElm.scrollWidth > this.titleElm.offsetWidth) {
          this.titleTooltip = addTooltip(this.titleElm, title); // 添加提示
        } else {
          this.titleTooltip?.destroy(); // 移除提示
        }
      });
    } else {
      console.warn('Title element not found!');
    }
  }

  setStatus(status: Status) {
    if (status === Status.Running) {
      this.messageBox.replaceChildren(
        this.titleElm,
        this.skipDisabledBtn,
        this.pauseBtn,
        this.stopBtn
      );
    } else if (status === Status.Paused) {
      this.messageBox.replaceChildren(
        this.titleElm,
        this.skipBtn,
        this.resumeBtn,
        this.stopBtn
      );
    } else if (status === Status.Stop) {
      this.messageBox.replaceChildren(
        this.titleElm,
        this.skipDisabledBtn,
        this.pauseBtn,
        this.stopBtn
      );
    }
  }

  hide() {
    this.messageBox.style.display = 'none';
    this.light.style.display = 'none';
  }

  show() {
    this.messageBox.style.display = 'flex';
    this.light.style.display = 'block';
  }

  pause(isEmit: boolean = false) {
    if (isEmit) {
      this.emit('pause');
    }
    this.setStatus(Status.Paused);
  }

  skip(isEmit: boolean = false) {
    if (isEmit) {
      this.emit('skip');
    }
  }

  resume(isEmit: boolean = false) {
    if (isEmit) {
      this.emit('resume');
    }
    this.setStatus(Status.Running);
    removeBreathe(this.resumeBtn);
    this.pauseTooltip?.destroy();
  }

  stop(isEmit: boolean = false) {
    if (isEmit) {
      this.emit('stop');
    }
    this.setStatus(Status.Stop);
    this.hide();
  }

  private createBreathingLight() {
    const light = document.createElement('div');
    light.classList.add('task-run-shadow');
    light.style.display = 'block';
    document.body.appendChild(light);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes shadow_fade {
          0%, to {
              box-shadow: inset 10px 10px 30px 0 rgba(20,118,255, 0.3), inset -10px -10px 30px 0 rgba(20,118,255, 0.3);
          }
          50% {
              box-shadow: inset 20px 20px 60px 0 rgba(20,118,255, 0.6), inset -20px -20px 60px 0 rgba(20,118,255, 0.6);
          }
      }
      .task-run-shadow {
          animation: shadow_fade 2.5s ease-in-out infinite;
          bottom: 0;
          display: none;
          height: 100vh;
          left: 0;
          pointer-events: none;
          position: fixed;
          right: 0;
          top: 0;
          width: 100vw;
          z-index: 2147483647;
          animation-play-state: running;
      }
  `;
    document.head.appendChild(style);
    return light;
  }

  destroy() {
    if (this.light && document.body.contains(this.light)) {
      document.body.removeChild(this.light);
    }
    if (this.messageBox && document.body.contains(this.messageBox)) {
      document.body.removeChild(this.messageBox);
    }
  }

  private pauseLight() {
    this.light.style.animationPlayState = 'paused';
  }

  private continueLight() {
    this.light.style.animationPlayState = 'running';
  }

  // 给恢复按钮加上提示
  tipToResume(tip: string) {
    addBreathe(this.resumeBtn);
    this.pauseTooltip = addTooltip(this.resumeBtn, tip);
  }
}

export default SchedulerUI;
