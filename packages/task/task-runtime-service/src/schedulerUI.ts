import EventEmitter from './eventEmitter';
import {
  addTwinkle,
  removeTwinkle,
} from '@opentiny/tiny-agent-task-action-lib';

import { addTooltip, removeTooltip } from './addTooltip';

// TODO: 使用时不应该每次都要new一个实例，全局new一次即可

const skipBtnStyles = {
  margin: '5px 10px 0 0',
  padding: '8px 15px',
  backgroundColor: '#f0f0f0',
  border: '1px solid #ddd',
  borderRadius: '4px',
  cursor: 'pointer',
};
const rightBtnStyles = {
  padding: '8px 15px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

type fn = () => void;

export class BreathAni {
  private emitter: EventEmitter;
  messageBox: HTMLDivElement;
  title: HTMLDivElement | null = null;
  pauseBtn!: HTMLButtonElement;
  skipBtn!: HTMLButtonElement;
  light: HTMLDivElement;

  constructor({ title }: { title: string }) {
    this.light = this.createBreathingLight();
    this.messageBox = this.createMessageBox();
    this.emitter = new EventEmitter();
    this.init({
      title,
      skipBtnData: {
        text: '跳过',
        onClick: () => this.skip(),
      },
      pauseBtnData: {
        text: '暂停',
        onClick: () => this.doPause(),
      },
    });
  }

  on(event: string, callback: (...args: any) => void): void {
    this.emitter.on(event, callback);
  }

  off(event: string, callback: (...args: any) => void): void {
    this.emitter.off(event, callback);
  }

  emit(event: string, ...args: any): void {
    this.emitter.emit(event, ...args);
  }

  private createMessageBox() {
    const box = document.createElement('div');
    const boxStyles = {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      padding: '15px 20px',
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      zIndex: '10000',
    };
    Object.assign(box.style, boxStyles);
    document.body.appendChild(box);
    return box;
  }

  private createBtn({
    text,
    styles,
    onClick,
  }: {
    text: string;
    styles: Record<string, string>;
    onClick: fn;
  }) {
    const btn = document.createElement('button');
    btn.textContent = text;
    Object.assign(btn.style, styles);
    return btn;
  }

  private init({
    title,
    skipBtnData,
    pauseBtnData,
  }: {
    title: string;
    skipBtnData: { text: string; onClick: fn };
    pauseBtnData: { text: string; onClick: fn };
  }) {
    this.title = document.createElement('div');
    this.title.textContent = title;
    this.skipBtn = this.createBtn({
      text: '跳过',
      styles: skipBtnStyles,
    });

    this.skipBtn.onclick = () => this.skip();

    this.stopBtn = this.createBtn({
      text: '终止',
      styles: skipBtnStyles,
    });

    this.stopBtn.onclick = () => this.doStop();

    this.pauseBtn = this.createBtn({
      text: pauseBtnData.text,
      styles: rightBtnStyles,
    });

    this.skipBtn.disabled = true;
    this.stopBtn.disabled = true;

    this.messageBox.append(
      this.title,
      this.skipBtn,
      this.stopBtn,
      this.pauseBtn
    );
  }

  changeState({ title, isPaused }: { title: string; isPaused: boolean }) {
    if (title) {
      this.title!.textContent = title; // 更新标题文本
    }
    if (isPaused === null || isPaused === undefined) {
      return; // 如果没有传入 isPaused，则不进行任何操作
    }
    if (isPaused) {
      this.pauseBtn.textContent = '继续';
      this.pauseBtn.onclick = () => this.doResume();
      this.skipBtn.disabled = false;
      this.stopBtn.disabled = false;
      this.pauseLight(); // 暂停呼吸灯动画
    } else {
      this.pauseBtn.textContent = '暂停';
      this.pauseBtn.onclick = () => this.doPause();
      this.skipBtn.disabled = true;
      this.stopBtn.disabled = true;
      this.continueLight();
    }
  }

  doPause() {
    this.pause();
    this.emit('pause');
  }

  pause() {
    this.changeState({ title: '操作暂停中...', isPaused: true });
  }

  skip() {
    this.emit('skip');
  }

  doResume() {
    this.resume();
    this.emit('resume');
  }

  resume() {
    this.changeState({ isPaused: false });
    removeTwinkle(this.pauseBtn);
    removeTooltip(this.pauseBtn);
  }

  doStop() {
    this.stop();
    this.emit('stop');
  }

  stop() {
    this.remove();
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
              box-shadow: inset 10px 10px 30px 0 #316fff4d, inset -10px -10px 30px 0 #159bde4d;
          }
          50% {
              box-shadow: inset 20px 20px 60px 0 #316fff99, inset -20px -20px 60px 0 #159bde99;
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

  remove() {
    if (document.body.contains(this.light)) {
      document.body.removeChild(this.light);
    }
    if (document.body.contains(this.messageBox)) {
      document.body.removeChild(this.messageBox);
    }
  }

  private pauseLight() {
    this.light.style.animationPlayState = 'paused';
  }

  private continueLight() {
    this.light.style.animationPlayState = 'running';
  }

  tipToResume(tip) {
    addTwinkle(this.pauseBtn);
    addTooltip(this.pauseBtn, '完成操作后点击继续');
  }
}

export default BreathAni;
