interface IParams {
  url: string;
  timeout?: number;
  method?: string;
}

interface IResult {
  response: any;
  matchInfo?: MatchInfo;
}

interface IContext {
  $axiosConfig?: {
    axios: any;
    timeout?: number;
    valid?: (result: IResult) => boolean;
  };
}

interface MatchInfo {
  matched: boolean;
  params: Record<string, string>;
  query: Record<string, string>;
  resUrl: string;
}

const resultMap: Record<string, IResult[]> = {};

const defaultValid = (result: IResult): boolean => {
  const { response } = result || {};
  const { status } = response || {};
  if (status >= 200 && status < 300) {
    return true;
  }
  return false;
};

// 将路径分解为数组并处理动态参数
const parsePath = (path: string): string[] => {
  return path.split('/').filter((segment) => segment !== '');
};

// 提取查询参数
const getQueryParams = (url: string) => {
  const params = {};
  const regex = /[?&]([^&=]+)=([^&]*)/g;
  let match;

  while ((match = regex.exec(url))) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
  }

  return params;
};

// 提取动态路由参数
function extractParams(
  resUrl: string,
  actionUrl: string
): Record<string, string> {
  const params: Record<string, string> = {};
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
function pathToRegex(path: string): RegExp {
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

const isMatchQuery = (query, resQuery) => {
  if (!query) {
    return true;
  }
  if (!Object.keys(query).length) {
    return true;
  }

  let isMatch = true;

  Object.entries(query).forEach(([key, value]) => {
    if (value !== resQuery[key]) {
      isMatch = false;
    }
  });

  return isMatch;
};

const matchUrl = (params: IParams, response: AxiosResponse): MatchInfo => {
  const { url, method, query } = params;
  const { method: reqMethod, url: resUrl } = response?.config || {};
  const trimQueryUrl = resUrl.split('?')[0];
  const resQuery = getQueryParams(resUrl);
  const isMathMethod = method
    ? method.toLowerCase() === reqMethod?.toLowerCase()
    : true;
  const regex = pathToRegex(url);
  const match =
    isMathMethod && trimQueryUrl?.match(regex) && isMatchQuery(query, resQuery);
  if (match) {
    const params = url.includes(':') ? extractParams(resUrl, url) : {};

    return {
      matched: true,
      params,
      resUrl,
      query,
    };
  }
  return {
    matched: false,
    params: {},
    query: {},
    resUrl: resUrl || '',
  };
};

const start = {
  name: 'apiConfirmStart',
  description: '确认接口返回成功',
  execute: async (
    params: IParams,
    context: IContext
  ): Promise<{ status: string }> => {
    const { $axiosConfig, $task } = context;
    const { axios, timeout: globalTimeout } = $axiosConfig || {};
    if (!axios) {
      return;
    }
    const { url, timeout: actionTime } = params;
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

    $task.addCleanEffect(() => {
      console.log('axios cleanEffect');
      setTimeout(remove, timeout);
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        try {
          const matchInfo = matchUrl(params, response);
          // console.log('success matchInfo', matchInfo);
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
          resultMap[url].push({ response: error.response, matchInfo });
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
  execute: async (
    params: IParams,
    context: IContext
  ): Promise<{ status: string; result?: any; error?: any }> => {
    const { url, timeout: actionTime } = params;
    const { $axiosConfig } = context;
    const { valid = defaultValid, timeout: globalTimeout } = $axiosConfig || {};
    const timeout = actionTime || globalTimeout || 20000;

    return new Promise(async (resolve, reject) => {
      const startTIme = Date.now();
      while (Date.now() - startTIme < timeout) {
        const result = resultMap[url]?.shift();
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
      reject({
        status: 'error',
        error: { message: '接口请求超时' },
      });
    });
  },
};

export default [start, end];
