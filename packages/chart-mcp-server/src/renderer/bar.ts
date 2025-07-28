import { createChart } from './createChart.js';
import { type BarProps } from '@antv/gpt-vis/dist/esm/Bar';
import { THEME_MAP } from '../theme';
import { CommonOptions } from './types';

export type BarOptions = CommonOptions & BarProps;

export async function Bar(options: BarOptions) {
  const {
    data,
    title,
    width = 600,
    height = 400,
    axisYTitle,
    axisXTitle,
    group,
    stack,
    theme = 'default',
  } = options;

  const hasGroupField = (data || [])[0]?.group !== undefined;
  let transforms: any = [];
  let radiusStyle = {};
  let encode = {};
  let labels: any = [
    {
      text: 'value',
      style: { dx: 2 },
      textAlign: 'start',
      transform: [{ type: 'overlapHide' }, { type: 'contrastReverse' }],
      fontSize: 10,
    },
  ];

  if (theme === 'default') {
    radiusStyle = { radiusTopLeft: 4, radiusTopRight: 4 };
  }

  if (group) {
    transforms = [
      {
        type: 'dodgeX',
      },
    ];
  }

  if (stack) {
    transforms = [
      {
        type: 'stackY',
      },
    ];
    labels = [
      {
        text: 'value',
        position: 'inside',
        transform: [{ type: 'overlapHide' }, { type: 'contrastReverse' }],
        fontSize: 10,
      },
    ];
  }

  if (hasGroupField) {
    encode = {
      x: 'category',
      y: 'value',
      color: 'group',
    };
  } else {
    encode = {
      x: 'category',
      y: 'value',
      color: 'category',
    };
  }


  return await createChart(chartType, {
    devicePixelRatio: 3,
    type: 'interval',
    theme: THEME_MAP[theme],
    width,
    height,
    title,
    data,
    encode: encode,
    transform: transforms,
    coordinate: { transform: [{ type: 'transpose' }] },
    insetRight: 24,
    style: {
      ...radiusStyle,
      columnWidthRatio: 0.8,
    },
    axis: {
      x: {
        title: axisXTitle,
      },
      y: {
        title: axisYTitle,
      },
    },
    labels: labels,
    scale: {
      y: {
        nice: true,
      },
    },
  });
}
