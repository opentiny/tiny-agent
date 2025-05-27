import type { IAxiosActionParams, MatchInfo } from './actions';

export function parsePath(path: string): string[] {
  return path.split('/').filter((segment) => segment !== '');
}

// 提取查询参数
export const getQueryParams = (url: string) => {
  const params: any = {};
  const regex = /[?&]([^&=]+)=([^&]*)/g;
  let match;

  while ((match = regex.exec(url))) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
  }

  return params;
};

// 提取动态路由参数
export function extractParams(
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
export function pathToRegex(path: string): RegExp {
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
export const isMatchQuery = (query: any, resQuery: any) => {
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
export const matchUrl = (
  params: IAxiosActionParams,
  response: any
): MatchInfo => {
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
