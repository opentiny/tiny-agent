const resultMap = {};

const defaultValid = (result) => {
  const { response } = result || {};
  const { status } = response || {};
  if (status >= 200 && status < 300) {
    return true;
  }
  return false;
};

// 将路径分解为数组并处理动态参数
const parsePath = (path) => {
  return path.split('/').filter((segment) => segment !== '');
};

// 提取动态参数
function extractParams(resUrl, actionUrl) {
  const params = {};
  const pathSegments = parsePath(resUrl);
  const routeSegments = parsePath(actionUrl);

  routeSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const paramName = segment.slice(1);
      params[paramName] = pathSegments[index];
    }
  });

  return params;
}

// 将路由路径转换为正则表达式
function pathToRegex(path) {
  const segments = parsePath(path);
  const regexParts = segments.map((segment) => {
    if (segment.startsWith(':')) {
      // 动态参数，匹配任意非斜杠字符
      return '([^/]+)';
    } else if (segment === '*') {
      // 通配符，匹配任意字符
      return '(.*)';
    } else {
      // 普通路径，精确匹配
      return segment;
    }
  });

  // 创建正则表达式，匹配整个路径
  const regex = '^/' + regexParts.join('/') + '/?$';
  return new RegExp(regex);
}

const matchUrl = (params, response) => {
  const { url, method } = params;
  const { method: reqMethod } = response?.config;
  const isMathMethod = method ? method.toLowerCase() === reqMethod : true;
  const { url: resUrl } = response.request;
  const regex = pathToRegex(url);
  const match = isMathMethod && resUrl.match(regex);
  if (match) {
    const params = url.includes(':') ? extractParams(resUrl, url) : {};

    return {
      matched: true,
      params,
      resUrl,
    };
  }
  return {
    matched: false,
    params: {},
    resUrl,
  };
};

const start = {
  name: 'apiConfirmStart',
  description: '确认接口返回成功',
  execute: async (params, context) => {
    const { url, timeout: actionTime } = params;
    const { $axiosConfig } = context;
    const { axios, timeout: globalTimeout } = $axiosConfig || {};
    const timeout = actionTime || globalTimeout || 20000;

    if (!resultMap[url]) {
      resultMap[url] = [];
    }

    let isRemove = false;
    const remove = () => {
      if (!isRemove) {
        isRemove = true;
        axios.interceptors.response.eject(responseInterceptor);
      }
    };

    context._clearEffect.push(() => {
      console.log('axios _clearEffect');
      setTimeout(remove, timeout);
    });
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        try {
          const matchInfo = matchUrl(params, response);
          if (!matchInfo.matched) {
            return response;
          }

          resultMap[url].push({ response, matchInfo });

          // 移除当前拦截器
          remove();

          return response;
        } catch (err) {
          console.error(err);
          return Promise.reject(err);
        }
      },
      (error) => {
        try {
          const matchInfo = matchUrl(params, error);
          if (!matchInfo.matched) {
            return Promise.reject(error);
          }
          resultMap[url].push({ response: error, matchInfo });
          remove();
          return Promise.reject(error);
        } catch (err) {
          console.error(err);
          return Promise.reject(err);
        }
      }
    );

    return { status: 'success' };
  },
};

const end = {
  name: 'apiConfirmEnd',
  description: '确认接口返回成功',
  execute: async (params, context) => {
    const { url, timeout: actionTime } = params;
    const { $axiosConfig } = context;
    const {
      axios,
      valid = defaultValid,
      timeout: globalTimeout,
    } = $axiosConfig || {};
    const timeout = actionTime || globalTimeout || 20000;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const startTIme = Date.now();
      while (Date.now() - startTIme < timeout) {
        const result = resultMap[url].shift();
        if (result) {
          const { response } = result;
          if (valid(result)) {
            resolve({
              status: 'success',
              result: response.data,
            });
          } else {
            reject({
              status: 'error',
              error: response.data,
            });
          }

          return;
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((waitFinish) => setTimeout(waitFinish, 100)); // 轮询间隔
      }
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({
        status: 'error',
        error: { message: '接口请求超时' },
      });
    });
  },
};

export default [start, end];
