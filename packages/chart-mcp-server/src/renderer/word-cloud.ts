import { createChart } from './createChart.js';
import { type WordCloudProps } from '@antv/gpt-vis/dist/esm/WordCloud';
import { THEME_MAP } from '../theme';
import { CommonOptions } from './types';

export type WordCloudOptions = CommonOptions & WordCloudProps;

export async function WordCloud(options: WordCloudOptions) {
  const { data, title, width = 600, height = 400, theme = 'default' } = options;
  return await createChart({
    devicePixelRatio: 3,
    type: 'wordCloud',
    theme: THEME_MAP[theme],
    layout: {
      fontSize: [8, 42],
    },
    title,
    data,
    width,
    height,
    encode: {
      text: 'text',
      color: 'text',
      value: 'value',
    },
    legend: false,
  });
}
