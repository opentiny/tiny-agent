import { createChart } from './createChart.js';
import { type ScatterProps } from '@antv/gpt-vis/dist/esm/Scatter';
import { THEME_MAP } from '../theme';
import { CommonOptions } from './types';

export type ScatterOptions = CommonOptions & ScatterProps;

export async function Scatter(options: ScatterOptions) {
  const {
    data,
    title,
    width = 600,
    height = 400,
    axisYTitle,
    axisXTitle,
    theme = 'default',
  } = options;

  return await createChart({
    devicePixelRatio: 3,
    type: 'point',
    theme: THEME_MAP[theme],
    data,
    width,
    height,
    title,
    encode: {
      x: 'x',
      y: 'y',
      // shape: 'point',
    },
    axis: {
      x: {
        title: axisXTitle,
      },
      y: {
        title: axisYTitle,
      },
    },
    insetRight: 4,
    style: { lineWidth: 1 },
    legend: { size: false },
    animate: false,
    tooltip: false,
  });
}
