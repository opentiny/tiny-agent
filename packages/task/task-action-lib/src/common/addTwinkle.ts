let isAddStyle = false;

const className = 'ta-twinkle';
const addStyle = () => {
  const id = 'tiny-agent-twinkle-style';
  const style = document.getElementById(id);
  if (style) {
    return;
  }
  const styleElement = document.createElement('style');
  styleElement.id = id;
  styleElement.innerHTML = `
.${className} {
  position: relative;
  overflow: visible;
  z-index: 1;
}

/* 伪元素用于光晕和虚化 */
.${className}::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  border-radius: 5px;
  pointer-events: none;
}

/* 呼吸灯与虚化效果 */
.${className}:not(.paused)::after {
  animation: glow 2s ease-in-out infinite;
  will-change: box-shadow, filter;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px 2px rgba(0, 123, 255, 0.4);
    filter: blur(2px);
  }
  50% {
    box-shadow: 0 0 15px 8px rgba(0, 123, 255, 0.7);
    filter: blur(6px);
  }
  100% {
    box-shadow: 0 0 5px 2px rgba(0, 123, 255, 0.4);
    filter: blur(2px);
  }
}

/* 鼠标悬停：增强光晕和虚化 */
.${className}:hover::after {
  animation: glow-hover 1.5s ease-in-out infinite;
}

.${className}:hover {
  background-color: #0056b3;
}

@keyframes glow-hover {
  0% {
    box-shadow: 0 0 10px 3px rgba(0, 123, 255, 0.7);
    filter: blur(3px);
  }
  50% {
    box-shadow: 0 0 20px 10px rgba(0, 123, 255, 1);
    filter: blur(8px);
  }
  100% {
    box-shadow: 0 0 10px 3px rgba(0, 123, 255, 0.7);
    filter: blur(3px);
  }
}

@keyframes glow-variant {
  0% {
    box-shadow: 0 0 5px 2px rgba(255, 105, 180, 0.4);
    filter: blur(2px);
  }
  50% {
    box-shadow: 0 0 15px 8px rgba(255, 105, 180, 0.7);
    filter: blur(5px);
  }
  100% {
    box-shadow: 0 0 5px 2px rgba(255, 105, 180, 0.4);
    filter: blur(2px);
  }
}

/* 暂停动画 */
.${className}.paused::after {
  box-shadow: none;
  filter: none;
}

/* 可访问性：聚焦样式 */
.${className}:focus {
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
}
  `;
  document.head.appendChild(styleElement);
};

const addTwinkle = (element: HTMLElement) => {
  if (!isAddStyle) {
    addStyle();
    isAddStyle = true;
  }
  element.classList.add(className);
};

const removeTwinkle = (element: HTMLElement) => {
  element.classList.remove(className);
};

export { addTwinkle, removeTwinkle };
