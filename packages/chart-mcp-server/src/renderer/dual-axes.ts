import { createChart } from './createChart.js';
import { THEME_MAP } from '../theme';
import { CommonOptions } from './types';

type DualAxesSeriesItem = {
  type: string;
  data: number[];
  axisYTitle?: string;
};

export type DualAxesOptions = CommonOptions & {
  title?: string;
  categories: string[];
  series: DualAxesSeriesItem[];
  axisXTitle?: string;
  legendTypeList?: string[];
};

export async function DualAxes(options: DualAxesOptions) {
  const { series, categories, title, width = 600, height = 400, theme = 'default' } = options;
  enum ChartType {
    Column = 'column',
    Line = 'line',
  }

  let radiusStyle = {};

  if (theme === 'default') {
    radiusStyle = { radiusTopLeft: 4, radiusTopRight: 4 };
  }

  function transform(series: DualAxesSeriesItem[], categories: string[]) {
    const newChildren = series
      .sort((a, b) => {
        const ORDER = ['column', 'line'];
        return ORDER.indexOf(a.type) - ORDER.indexOf(b.type);
      })
      .map((item: any) => {
        const { type, axisYTitle, ...others } = item;

        const baseConfig = {
          ...others,
          axis: { y: { title: axisYTitle } },
          encode: { x: 'category', y: axisYTitle, color: () => axisYTitle },
          legend: {
            color: {
              itemMarker: (v: any) => {
                if (v === axisYTitle) return 'smooth';
                return 'rect';
              },
            },
          },
          data: undefined,
        };

        if (type === ChartType.Column) {
          return {
            ...baseConfig,
            type: 'interval',
            style: { columnWidthRatio: 0.8, ...radiusStyle },
          };
        }

        if (type === ChartType.Line) {
          return {
            ...baseConfig,
            type,
            axis: { y: { position: 'right', title: axisYTitle } },
            encode: { x: 'category', y: axisYTitle, shape: 'smooth', color: () => axisYTitle },
            style: { lineWidth: 2 },
            scale: { y: { independent: true } },
          };
        }

        return baseConfig;
      });

    const newData = categories.map((item: string, index: number) => {
      const temp = {
        category: item,
      } as {
        category: string;
        [key: string]: any;
      };
      series.forEach((s: DualAxesSeriesItem, i: number) => {
        const defaultYField = s.axisYTitle || `value_${i + 1}`;
        temp[defaultYField] = s.data[index];
      });
      return temp;
    });

    // todo: GPT-Vis 的 legendTypeList 是必选，不合理
    const legendTypeList = series.map((item: any) => {
      return item.type === ChartType.Line ? 'smooth' : 'rect';
    });

    return {
      children: newChildren,
      data: newData,
      legendTypeList,
    };
  }

  const config = transform(series, categories);

  return await createChart({
    devicePixelRatio: 3,
    type: 'view',
    theme: THEME_MAP[theme],
    autoFit: true,
    title,
    width,
    height,
    ...config,
  });
}
