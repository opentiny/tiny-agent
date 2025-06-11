# 自定义调度器界面UI

调度器界面UI支持由用户完全自定义，只需自定义的UI满足以下`ITaskUI`类型即可。

```typescript
type ITaskUIEvent = 'skip' | 'pause' | 'resume' | 'stop';
interface ITaskUI {
  show(): void;
  hide(): void;
  stop(): void;
  pause(isEmit?: boolean): void;
  skip?: (isEmit?: boolean) => void;
  resume(isEmit?: boolean): void;
  destroy(): void;
  on(event: ITaskUIEvent, callback: (...args: any[]) => void): void;
  off(event: ITaskUIEvent, callback: (...args: any[]) => void): void;
}
```

## 参考示例

```typescript
import { type ITaskUI, EventEmitter } from '@opentiny/tiny-agent-task-runtime-service';

export enum Status {
  Stop = 'stop',
  Running = 'running',
  Paused = 'paused',
}


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

export class CustomTaskUI implements ITaskUI {
  protected btnBox: HTMLDivElement;
  protected pauseBtn!: HTMLImageElement;
  protected skipBtn!: HTMLImageElement;
  protected skipDisabledBtn!: HTMLImageElement;
  protected stopBtn!: HTMLImageElement;
  protected stopDisabledBtn!: HTMLImageElement;
  protected resumeBtn!: HTMLImageElement;
  protected light: HTMLDivElement;
  protected titleTooltip: { destroy: () => void } | null = null;
  protected pauseTooltip: { destroy: () => void } | null = null;
  protected emitter: EventEmitter;

  constructor() {
    this.light = this.createBreathingLight();
    this.btnBox = this.btnBox();
    this.init();
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

  protected btnBox() {
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

  protected init({ title }: { title: string }) {

    this.setTitle(title);

    this.skipBtn = createImg(skip);
    this.skipBtn.onclick = () => this.skip(true);
    this.skipBtn.title = t('taskUI.skip');

    this.skipDisabledBtn = createImg(skipDisabled);
    this.skipDisabledBtn.style.cursor = 'not-allowed';

    this.stopBtn = createImg(stop);
    this.stopBtn.onclick = () => this.stop(true);
    this.stopBtn.title = t('taskUI.stop');

    this.stopDisabledBtn = createImg(stopDisabled);
    this.stopDisabledBtn.style.cursor = 'not-allowed';

    this.pauseBtn = createImg(pause);
    this.pauseBtn.onclick = () => this.pause(true);
    this.pauseBtn.title = t('taskUI.pause');

    this.resumeBtn = createImg(resume);
    this.resumeBtn.onclick = () => this.resume(true);
    this.resumeBtn.title = t('taskUI.resume');

    this.btnBox.append(, this.skipDisabledBtn, this.pauseBtn, this.stopBtn);

    this.hide(); // 初始化时隐藏
  }


  setStatus(status: Status) {
    if (status === Status.Running) {
      this.btnBox.replaceChildren( this.skipDisabledBtn, this.pauseBtn, this.stopBtn);
      this.continueLight();
    } else if (status === Status.Paused) {
      this.btnBox.replaceChildren( this.skipBtn, this.resumeBtn, this.stopBtn);
      this.pauseLight();
    } else if (status === Status.Stop) {
      this.btnBox.replaceChildren( this.skipDisabledBtn, this.pauseBtn, this.stopBtn);
      this.pauseLight();
    }
  }

  hide() {
    this.btnBox.style.display = 'none';
    this.light.style.display = 'none';
  }

  show() {
    this.btnBox.style.display = 'flex';
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
              box-shadow: inset 20px 20px 60px 0 rgba(20,118,255, 0.5), inset -20px -20px 60px 0 rgba(20,118,255, 0.5);
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
    if (this.btnBox && document.body.contains(this.btnBox)) {
      document.body.removeChild(this.btnBox);
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
```

## 链接UI

```typescript
import { ActionManager, TaskScheduler } from '@opentiny/tiny-agent-task-runtime-service';
import { BaseActions } from '@opentiny/tiny-agent-task-action-lib';
const actionManager = new ActionManager();
const taskUI = new CustomTaskUI();
const taskScheduler = new TaskScheduler(actionManager, context);
// 链接自定义的UI
taskScheduler.connectTaskUI(taskUI);
actionManager.registerActions(BaseActions);
```

## 自定义UI预览
