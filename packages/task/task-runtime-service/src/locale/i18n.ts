import zhCN from './zh-CN.json';
import enUS from './en-US.json';

export interface I18n {
  [key: string]: any;
}

let locale = 'zhCN';

export const setLocale = (lang: string) => {
  locale = lang;
};

const getValue = (key: string) => {
  const words = locale === 'zhCN' ? zhCN : enUS;
  const keyArr = key.split('.');
  let value = (words as I18n)[keyArr[0]];
  for (let i = 1; i < keyArr.length; i++) {
    value = value[keyArr[i]];
  }
  return value;
};

export const t = (key: string, params?: Record<string, string>) => {
  return (
    getValue(key)?.replace(
      /\{\{(.*?)\}\}/g,
      (match: string, p1: string) => params?.[p1] || match
    ) || key
  );
};
