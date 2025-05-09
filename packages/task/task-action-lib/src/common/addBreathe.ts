import '../assets/styles/breathe.css';

const className = 'ta-breathe';

const addBreathe = (element: HTMLElement) => {
  element.classList.add(className);
};

const removeBreathe = (element: HTMLElement) => {
  element.classList.remove(className);
};

export { addBreathe, removeBreathe };
