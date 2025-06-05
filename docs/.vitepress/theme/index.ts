import DefaultTheme  from "vitepress/theme";
import TinyRobot from '@opentiny/tiny-robot';
import '@opentiny/tiny-robot/dist/style.css';

export default {
  ...DefaultTheme,
    enhanceApp({ app}) {
    app.use(TinyRobot); // TODO: SSR可能有问题，需要改成动态import
  }
}