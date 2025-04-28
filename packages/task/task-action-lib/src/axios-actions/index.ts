const resultMap = {};

const defaultValid = (response) => {
  const { status } = response;
  if (status >= 200 && status < 300) {
    return true;
  }
  return false;
};

const isTargetUrl = (url, response) => {
  const { url: resUrl } = response.request;
  if (url === resUrl) {
    return true;
  }
  return false;
};

const start = {
  name: 'apiConfirmStart',
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

    if (!resultMap[url]) {
      resultMap[url] = [];
    }

    let isRemove = false;

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        console.log('axios action', response);
        if (!isTargetUrl(url, response)) {
          return response;
        }

        if (valid(response)) {
          resultMap[url].push({
            status: 'success',
            result: response.data,
          });
        } else {
          resultMap[url].push({
            status: 'error',
            error: response.data,
          });
        }

        // 移除当前拦截器
        isRemove = true;
        axios.interceptors.response.eject(responseInterceptor);
        return response;
      },
      (error) => {
        console.log('axios action', error);
        if (!isTargetUrl(url, error)) {
          return Promise.reject(error);
        }
        resultMap[url].push({
          status: 'error',
          error: error?.response?.data,
        });
        isRemove = true;
        axios.interceptors.response.eject(responseInterceptor);
        return Promise.reject(error);
      }
    );

    // 超时移除当前拦截器
    setTimeout(() => {
      if (!isRemove) {
        // 移除当前拦截器
        axios.interceptors.response.eject(responseInterceptor);
      }
    }, timeout);

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
          if (result.status === 'success') {
            resolve(result);
          } else {
            reject(result);
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
