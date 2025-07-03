import { GridStack } from 'gridstack';

export function renderDashboard(imageList: string[]) {
  const dashboardArea = document.querySelector('.girdstack-area');
  dashboardArea.innerHTML = '';
  const dashboardMain = document.createElement('div');
  dashboardMain.className = 'grid-stack';
  dashboardArea?.appendChild(dashboardMain);

  const grid = GridStack.init({
    float: true,
    cellHeight: '70px',
    column: 'auto',
    disableDrag: true,
    minRow: 1,
  });
  const items: any[] = [];
  items.length = imageList.length;
  let x = 1;

  for (let i = 0; i < items.length; i++) {
    items[i] = { id: i, x: x, w: 2, h: 1.27 };
    x += 2;
  }
  grid.load(items);

  const els = dashboardMain.querySelectorAll('.grid-stack-item-content');
  els.forEach((el, index) => {
    el.innerHTML = `<div class="dashboard-content">
                        <image style="width: 100%;height: 100%" src=${imageList[index]} alt="" />
                    </div>`;
  });

  return dashboardArea;
}

// tool(
//   'renderDashboard',
//   '生成看板',
//   {
//     className: z.string().describe('主容器DOM的class'),
//     imageList: z.array().describe('看板图表的URL地址集合')
//   },
//   ({ className, imageList }) => {
//     const dom = renderDashboard(className, imageList);

//     return {
//       content: [
//         {
//           type: 'text',
//           text: dom
//         }
//       ]
//     };
//   }
// );
