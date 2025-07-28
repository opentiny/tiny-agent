import { z } from 'zod';
import { zodToJsonSchema } from '../utils/index.js';
import { THEME_MAP } from '../theme.js';
import { AxisXTitleSchema, AxisYTitleSchema, HeightSchema, ThemeSchema, TitleSchema, WidthSchema } from './base.js';

// Bar chart data schema
const data = z.object({
  category: z.string(),
  value: z.number(),
  group: z.string().optional(),
});

// Bar chart input schema
const schema = {
  data: z
    .array(data)
    .describe("Data for bar chart, such as, [{ category: '分类一', value: 10 }].")
    .nonempty({ message: 'Bar chart data cannot be empty.' }),
  group: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether grouping is enabled. When enabled, bar charts require a 'group' field in the data. When `group` is true, `stack` should be false.",
    ),
  stack: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "Whether stacking is enabled. When enabled, bar charts require a 'group' field in the data. When `stack` is true, `group` should be false.",
    ),
  theme: ThemeSchema,
  width: WidthSchema,
  height: HeightSchema,
  title: TitleSchema,
  axisXTitle: AxisXTitleSchema,
  axisYTitle: AxisYTitleSchema,
};

const generateOptions = (args: any) => {
  const { data, title, width = 600, height = 400, axisYTitle, axisXTitle, group, stack, theme = 'default' } = args;

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

  return {
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
  };
};

/**
 * @param args - The arguments for the bar chart
 * @returns The webcomponent of the bar chart
 */
const handler = async (args: unknown) => {
  const options = generateOptions(args[0]);

  const component = `
  <script src="https://unpkg.com/@antv/g2/dist/g2.min.js"></script>
      <script type="module">
        class BarChart extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
          }

          connectedCallback() {
            const container = document.createElement('div');
            container.style.width = this.getAttribute('width');
            container.style.height = this.getAttribute('height');
            this.shadowRoot.appendChild(container);

            this.chart = new G2.Chart({
              container,
            });

            this.chart.options(${JSON.stringify(options)});
            this.chart.render();
          }

          disconnectedCallback() {
            this.chart?.destroy();
          }

          static get observedAttributes() {
            return ['data'];
          }

          attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'data' && this.chart) {
              const data = JSON.parse(newValue);
              this.chart.changeData(data);
            }
          }
        }

        customElements.define('bar-chart', BarChart);
      </script>
      <bar-chart
        width="100%"
        height="100%"
      ></bar-chart>`;

  return {
    content: [
      {
        type: 'text',
        text: component,
      },
    ],
    structuredContent: {
      component,
    },
  };
};

// Bar chart tool descriptor
const tool = {
  name: 'generate_bar_chart',
  description:
    'Generate a bar chart to show data for numerical comparisons among different categories, such as, comparing categorical data and for horizontal comparisons.',
  inputSchema: zodToJsonSchema(schema),
  handler,
};

export const bar = {
  schema,
  tool,
};
