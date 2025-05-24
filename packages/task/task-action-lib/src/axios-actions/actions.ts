import { t } from '../locale/i18n';
import { matchUrl } from './url-utils';

export const AXIOS_CONTEXT_KEY = 'axiosConfig';

export interface IAxiosActionParams {
  url: string;
  timeout?: number;
  method?: string;
  query: Record<string, string>;
}

export interface IRequestResult {
  response: any;
  matchInfo?: MatchInfo;
}

export interface IAxiosConfig {
  axios: any;
  timeout?: number;
  valid?: (result: IRequestResult) => boolean;
}

export interface IAxiosActionContext {
  [AXIOS_CONTEXT_KEY]?: IAxiosConfig;
  $task?: any;
}

export interface MatchInfo {
  matched: boolean;
  params: Record<string, string>;
  query: Record<string, string>;
  resUrl: string;
}

const resultMap: Record<string, IRequestResult[]> = {};

const defaultValid = (result: IRequestResult): boolean => {
  const { response } = result || {};
  const { status } = response || {};
  if (status >= 200 && status < 300) {
    return true;
  }
  return false;
};

const start = {
  name: 'apiConfirmStart',
  description: t('axiosActions.description.startEnd'),
  execute: async (
    params: IAxiosActionParams,
    context: IAxiosActionContext
  ): Promise<{ status: string } | undefined> => {
    const { $task } = context;
    const axiosConfig = context[AXIOS_CONTEXT_KEY];
    const { axios, timeout: globalTimeout } = axiosConfig || {};
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
      setTimeout(remove, timeout);
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response: any) => {
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
      (error: any) => {
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
  description: t('axiosActions.description.startEnd'),
  execute: async (
    params: IAxiosActionParams,
    context: IAxiosActionContext
  ): Promise<{ status: string; result?: any; error?: any }> => {
    const { url, timeout: actionTime } = params;
    const axiosConfig = context[AXIOS_CONTEXT_KEY];
    const { valid = defaultValid, timeout: globalTimeout } = axiosConfig || {};
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
        await new Promise((waitFinish) => setTimeout(waitFinish, 100));
      }
      reject({
        status: 'error',
        error: { message: t('axiosActions.timeout') },
      });
    });
  },
};

export const AxiosActions = [start, end];
