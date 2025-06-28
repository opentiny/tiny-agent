import { h } from 'vue';
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs';
const aiAvatar = h(IconAi, { style: { fontSize: '32px' } });
const userAvatar = h(IconUser, { style: { fontSize: '32px' } });

// 定义角色图标以及样式
export const roles = {
  assistant: {
    placement: 'start',
    avatar: aiAvatar,
    maxWidth: '90%',
    type: 'markdown',
    mdConfig: { html: true },
  },
  user: {
    placement: 'end',
    avatar: userAvatar,
    maxWidth: '90%',
    type: 'markdown',
    mdConfig: { html: true },
  },
};

export const promptItems = [
  {
    label: '列出工具',
    description: '列出目前系统中可用的工具！',
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
  {
    label: '界面操作',
    description: '通过界面新增用户 张三 男 2000-1-1',
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
  {
    label: '函数调用',
    description: '新增用户 李四 女 2000-2-2',
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
  {
    label: '生成图表',
    description:`请生成一个饼图，具体为环图，边缘圆角，展示各平台的成本。数据列在右方，中间展示成本总计数，下方展示"总计(元)"，
- 淘乐电商网站 900人民币
- 淘乐本地生活 500人民币
- 淘乐粉论坛 200人民币
- 企业品牌网站 100人民币
- 其他 34.9人民币`,
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
];
