import { addBreathe, addTooltip, removeBreathe } from '@opentiny/tiny-agent-ui-components';
import { EventEmitter } from './event-emitter';
import { t } from './locale/i18n';
import './assets/style/task-ui.css';
import skip from './assets/images/skip.svg?raw';
import pause from './assets/images/pause.svg?raw';
import resume from './assets/images/resume.svg?raw';
import stop from './assets/images/stop.svg?raw';

// UI运行状态 TODO: 需要扩展loading状态
export enum Status {
  Stop = 'stop',
  Running = 'running',
  Paused = 'paused',
}

const createSvg = (svg: string) => {
  const container = document.createElement('div');
  container.innerHTML = svg;
  container.className = 'ta-task-ui-icon';
  return container;
};

export type ITaskUIEvent = 'skip' | 'pause' | 'resume' | 'stop';
export interface ITaskUI {
  show(): void;
  hide(): void;
  stop(): void;
  pause(isEmit?: boolean): void;
  skip(isEmit?: boolean): void;
  resume(isEmit?: boolean): void;
  destroy(): void;
  on(event: ITaskUIEvent, callback: (...args: any[]) => void): void;
  off(event: ITaskUIEvent, callback: (...args: any[]) => void): void;
  setTitle?: (title: string) => void;
  tipToResume?: (tip: string) => void;
}

export class TaskUI implements ITaskUI {
  protected messageBox: HTMLDivElement;
  protected titleElm!: HTMLDivElement;
  protected pauseBtn!: HTMLDivElement;
  protected skipBtn!: HTMLDivElement;
  protected skipDisabledBtn!: HTMLDivElement;
  protected stopBtn!: HTMLDivElement;
  protected stopDisabledBtn!: HTMLDivElement;
  protected resumeBtn!: HTMLDivElement;
  protected light: HTMLDivElement;
  protected titleTooltip: { destroy: () => void } | null = null;
  protected pauseTooltip: { destroy: () => void } | null = null;
  protected emitter: EventEmitter;

  constructor({ title }: { title: string }) {
    this.light = this.createBreathingLight();
    this.messageBox = this.createMessageBox();
    this.init({ title });
    this.emitter = new EventEmitter();
  }

  on(event: ITaskUIEvent, callback: (...args: any[]) => void): void {
    this.emitter.on(event, callback);
  }

  off(event: ITaskUIEvent, callback?: (...args: any[]) => void): void {
    this.emitter.off(event, callback);
  }

  protected emit(event: ITaskUIEvent, ...args: any[]): void {
    this.emitter.emit(event, ...args);
  }

  protected createMessageBox() {
    const box = document.createElement('div');
    box.classList.add('ta-task-ui-box');
    document.body.appendChild(box);
    return box;
  }

  protected init({ title }: { title: string }) {
    this.titleElm = document.createElement('div');
    this.titleElm.classList.add('ta-task-ui-title');
    this.setTitle(title);

    this.skipBtn = createSvg(skip);
    this.skipBtn.onclick = () => this.skip(true);
    this.skipBtn.title = t('taskUI.skip');

    this.skipDisabledBtn = createSvg(skip);
    this.skipDisabledBtn.classList.add('is-disabled');
    this.skipDisabledBtn.style.cursor = 'not-allowed';

    this.stopBtn = createSvg(stop);
    this.stopBtn.onclick = () => this.stop(true);
    this.stopBtn.title = t('taskUI.stop');

    this.stopDisabledBtn = createSvg(stop);
    this.stopDisabledBtn.classList.add('is-disabled');
    this.stopDisabledBtn.style.cursor = 'not-allowed';

    this.pauseBtn = createSvg(pause);
    this.pauseBtn.onclick = () => this.pause(true);
    this.pauseBtn.title = t('taskUI.pause');

    this.resumeBtn = createSvg(resume);
    this.resumeBtn.onclick = () => this.resume(true);
    this.resumeBtn.title = t('taskUI.resume');

    this.messageBox.append(this.titleElm, this.skipDisabledBtn, this.pauseBtn, this.stopBtn);

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
      this.messageBox.replaceChildren(this.titleElm, this.skipDisabledBtn, this.pauseBtn, this.stopBtn);
      this.continueLight();
    } else if (status === Status.Paused) {
      this.messageBox.replaceChildren(this.titleElm, this.skipBtn, this.resumeBtn, this.stopBtn);
      this.pauseLight();
    } else if (status === Status.Stop) {
      this.messageBox.replaceChildren(this.titleElm, this.skipDisabledBtn, this.pauseBtn, this.stopBtn);
      this.pauseLight();
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

  protected createBreathingLight() {
    const light = document.createElement('div');
    light.classList.add('ta-task-ui-shadow', 'ta-task-ui-shadow--reduce-motion');
    light.style.display = 'block';
    document.body.appendChild(light);
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

  protected pauseLight() {
    this.light.style.animationPlayState = 'paused';
  }

  protected continueLight() {
    this.light.style.animationPlayState = 'running';
  }

  // 给恢复按钮加上提示
  tipToResume(tip: string) {
    addBreathe(this.resumeBtn);
    this.pauseTooltip = addTooltip(this.resumeBtn, tip);
  }
}
