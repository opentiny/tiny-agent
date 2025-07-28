import { Area } from './area.js';
import { Bar } from './bar.js';
import { Boxplot } from './boxplot.js';
import { Column } from './column.js';
import { DualAxes } from './dual-axes.js';
import { FishboneDiagram } from './fishbone-diagram.js';
import { FlowDiagram } from './flow-diagram.js';
import { Funnel } from './funnel.js';
import { Histogram } from './histogram.js';
import { Line } from './line.js';
import { Liquid } from './liquid.js';
import { MindMap } from './mind-map.js';
import { NetworkGraph } from './network-graph.js';
import { OrganizationChart } from './organization-chart.js';
import { Pie } from './pie.js';
import { Radar } from './radar.js';
import { Sankey } from './sankey.js';
import { Scatter } from './scatter.js';
import { Treemap } from './treemap.js';
import { Venn } from './venn.js';
import { Violin } from './violin.js';
import { WordCloud } from './word-cloud.js';

/**
 * 所有的 Vis 类型
 * @type {Record<VisType, (options: Options) => Promise<Buffer>>}
 */
export const VIS = {
  area: Area,
  bar: Bar,
  boxplot: Boxplot,
  column: Column,
  'dual-axes': DualAxes,
  'fishbone-diagram': FishboneDiagram,
  'flow-diagram': FlowDiagram,
  funnel: Funnel,
  histogram: Histogram,
  line: Line,
  liquid: Liquid,
  'mind-map': MindMap,
  'network-graph': NetworkGraph,
  'organization-chart': OrganizationChart,
  pie: Pie,
  radar: Radar,
  sankey: Sankey,
  scatter: Scatter,
  treemap: Treemap,
  violin: Violin,
  venn: Venn,
  'word-cloud': WordCloud,
};

export const generateChart = (type: string, options: Record<string, any>) => {
  const chart = new (charts[type])();
  chart.render(options);
};