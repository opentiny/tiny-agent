import { createApp } from 'vue';
import TinyRobot from '@opentiny/tiny-robot';
import '@opentiny/tiny-robot/dist/style.css';
import './style.css';
import App from './App.vue';
import './scheduler';

const app = createApp(App);
app.use(TinyRobot);
app.mount('#app');
