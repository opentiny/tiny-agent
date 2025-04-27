
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
  messageBox: HTMLDivElement;
  title: HTMLDivElement | null = null;
  pauseBtn!: HTMLButtonElement;
  skipBtn!: HTMLButtonElement;
  onPaused: fn;
  onContinue: fn;
  onSkip: fn;
  onStop: fn;
  light: HTMLDivElement;
  constructor({
    title,
    onPaused,
    onContinue,
    onSkip,
    onStop,
  }: {
    title: string;
    onPaused: fn;
    onContinue: fn;
    onSkip: fn;
    onStop: fn;
  }) {
    this.light = this.createBreathingLight();
    this.messageBox = this.createMessageBox();
    this.onPaused = onPaused;
    this.onContinue = onContinue;
    this.onSkip = onSkip;
    this.onStop = onStop;
    this.init({
      title,
      skipBtnData: {
        text: '终止',
        onClick: this.onSkip,
      },
      pauseBtnData: {
        text: '暂停',
        onClick: this.onPaused,
      },
    });
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
    btn.addEventListener('click', () => {
      onClick();
      if (this.skipBtn.onclick === this.onStop) {
        this.remove();
      }
    });
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
      text: skipBtnData.text,
      styles: skipBtnStyles,
      onClick: skipBtnData.onClick,
    });

    this.pauseBtn = this.createBtn({
      text: pauseBtnData.text,
      styles: rightBtnStyles,
      onClick: pauseBtnData.onClick,
    });

    this.messageBox.append(this.title, this.skipBtn, this.pauseBtn);
  }

  changeState({ title, isPaused }: { title: string; isPaused: boolean }) {
    if (title) {
      this.title!.textContent = title; // 更新标题文本
    }
    if (isPaused) {
      this.pauseBtn.textContent = '继续';
      this.pauseBtn.onclick = this.onContinue;
      this.skipBtn.textContent = '终止';
      this.skipBtn.onclick = this.onStop;

      this.pauseLight(); // 暂停呼吸灯动画
    } else {
      this.pauseBtn.textContent = '暂停';
      this.pauseBtn.onclick = this.onPaused;
      this.skipBtn.textContent = '跳过';
      this.skipBtn.onclick = this.onSkip;
      this.continueLight();
    }
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
    document.body.removeChild(this.light);
    document.body.removeChild(this.messageBox);
  }
  private pauseLight() {
    this.light.style.animationPlayState = 'pause';
  }
  private continueLight() {
    this.light.style.animationPlayState = 'running';
  }
}

const bre = new BreathAni({
  title: '操作暂停中，请登录...',
  onPaused: () => {
    console.log('onPaused: ');
  },
  onContinue: () => {
    console.log('onPaused: ');
  },
  onSkip: () => {
    console.log('jump: ');
  },
  onStop: () => {
    console.log('stop: ');
  },
});

bre.changeState({
  title: '操作暂停中，请登录...操作暂停中，请登录....操作暂停中，请登录...',
  isPaused: true,
});
setTimeout(() => {
  bre.changeState({ title: '操作中...', isPaused: false });
}, 2000);
