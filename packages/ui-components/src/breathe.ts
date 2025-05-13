const className = 'ta-breathe';

let isInsert = false;

const insertStyle = () => {
  if (isInsert) return;
  import('./assets/styles/breathe.css?raw').then(({ default: string }) => {
    const style = document.createElement('style');
    style.textContent = string;
    document.head.appendChild(style);
  });
  isInsert = true;
};
const addBreathe = (element: HTMLElement) => {
  insertStyle();
  element.classList.add(className);
};

const removeBreathe = (element: HTMLElement) => {
  element.classList.remove(className);
};

export { addBreathe, removeBreathe };
