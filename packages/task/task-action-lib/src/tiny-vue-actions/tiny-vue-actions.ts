import type { IAction } from '@opentiny/tiny-agent-task-runtime-service';
import { findElement, getElementByText, simulateClick } from '../base-actions';

enum TinyVueActionType {
  SELECT_DATE = 'selectDate',
}

const selectDate: IAction = {
  name: TinyVueActionType.SELECT_DATE,
  execute: async (params: { selector: string; date: string }) => {
    const { selector, date } = params;
    const element = await findElement(selector, 10000);

    const dateArr = date.split('-');
    const year = Number(dateArr[0]);
    const month = Number(dateArr[1]);
    const day = Number(dateArr[2]);

    // 选择年份
    const yearSelect = element.querySelector('.tiny-date-picker__header-label');
    await simulateClick(yearSelect as any);
    const firstYear = Number((element.querySelector('.tiny-year-table td:first-child') as any).innerText);
    const lastYear = Number((element.querySelector('.tiny-year-table tr:last-child td:last-child') as any).innerText);
    if (year <= lastYear && year >= firstYear) {
      const targetYear = (await getElementByText(element, year.toString())) as any;

      await simulateClick(targetYear);
    } else if (year > lastYear) {
      const clickCount = Math.ceil((year - lastYear) / 12);
      const nextYear = element.querySelector('.tiny-date-picker__next-btn') as any;
      for (let i = 0; i < clickCount; i++) {
        await simulateClick(nextYear);
      }
      const targetYear = (await getElementByText(element, year.toString())) as any;
      await simulateClick(targetYear);
    } else if (year < firstYear) {
      const clickCount = Math.ceil((firstYear - year) / 12);
      const prevYear = element.querySelector('.tiny-date-picker__prev-btn') as any;
      for (let i = 0; i < clickCount; i++) {
        await simulateClick(prevYear);
      }
      const targetYear = (await getElementByText(element, year.toString())) as any;
      await simulateClick(targetYear);
    }

    // 选择月份
    const monthSelect = element.querySelectorAll('.tiny-month-table td')[month - 1] as any;
    await simulateClick(monthSelect);
    // 选择日期
    const daySelect = element.querySelectorAll('.tiny-date-table td.available')[day - 1] as any;
    await simulateClick(daySelect);

    return {
      status: 'success',
    };
  },
} as IAction;

export const TinyVueActions = [selectDate];
