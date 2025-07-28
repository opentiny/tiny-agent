import { z } from 'zod';
import { zodToJsonSchema } from '../utils/index.js';
import { AxisXTitleSchema, AxisYTitleSchema, HeightSchema, ThemeSchema, TitleSchema, WidthSchema } from './base.js';

const data = z.object({
  category: z.string().describe("Category of the data point, such as '分类一'."),
  value: z.number().describe('Value of the data point, such as 10.'),
  group: z.string().optional().describe('Optional group for the data point, used for grouping in the boxplot.'),
});

const schema = {
  data: z
    .array(data)
    .describe(
      "Data for boxplot chart, such as, [{ category: '分类一', value: 10 }] or [{ category: '分类二', value: 20, group: '组别一' }].",
    )
    .nonempty({ message: 'Boxplot chart data cannot be empty.' }),
  theme: ThemeSchema,
  width: WidthSchema,
  height: HeightSchema,
  title: TitleSchema,
  axisXTitle: AxisXTitleSchema,
  axisYTitle: AxisYTitleSchema,
};

const handler = async (args: unknown): Promise<string> => {
  const component = '';
  return component;
};

const tool = {
  name: 'generate_boxplot_chart',
  description:
    'Generate a boxplot chart to show data for statistical summaries among different categories, such as, comparing the distribution of data points across categories.',
  inputSchema: zodToJsonSchema(schema),
  handler,
};

export const boxplot = {
  schema,
  tool,
};
