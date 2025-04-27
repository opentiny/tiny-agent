import { Action } from '../common/action';
import { ActionManager } from './actionManager';
import { executeActions } from './execute';

// 创建插件管理实例
const manager = new ActionManager();

// 模拟异步获取location
const getLocation: Action = {
  name: 'getLocation',
  execute: async (params, context) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          result: { location: Math.random() > 0.5 ? 'beijing' : 'jiangxi' },
        });
      }, 500);
    });
  },
};

// // 模拟异步获取weather,params依赖 getLocation 返回值
const getWeather: Action = {
  name: 'getWeather',
  execute: async (params, context) => {
    const { location } = params;
    console.log('获取的上一个action结果; ', params);
    const mockWeather: any = {
      beijing: { temp: '25摄氏度', weather: '多云' },
      jiangxi: { temp: '26摄氏度', weather: '天晴' },
    };
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          result: { weather: mockWeather[location] },
        });
      }, 500);
    });
  },
};

// 注册单个ACTION
manager.registerAction(getLocation);
manager.registerAction(getWeather);

// 批量注册ACTION
console.log('插件列表：', manager.getActionList());

// 使用示例
const actionList = [
  { action: 'getLocation', params: {}, context: null },
  { action: 'getWeather', params: {}, context: null },
];

executeActions(manager, actionList)
  .then((finalContext) => {
    console.log('最终结果:', finalContext);
  })
  .catch((error) => {
    console.error('链式执行出错:', error);
  });
