import type { IActionResult } from './action.type';
import type { IInstructionSchema } from './schema.type';
import type { ActionManager } from './action-manager';
import type { ISchedulerContext } from './task-scheduler';
import { ActionResultStatus } from './action.type';
import { t } from './locale/i18n';

export interface IInstructionExecutor {
  execute(instruction?: IInstructionSchema): Promise<IActionResult>;
}

export class Instruction implements IInstructionExecutor {
  protected actionManager: ActionManager;
  protected context: ISchedulerContext;
  protected instruction: IInstructionSchema;

  constructor(instruction: IInstructionSchema, actionManager: ActionManager, context: ISchedulerContext) {
    this.instruction = instruction;
    this.actionManager = actionManager;
    this.context = context;
  }

  async execute(instruction?: IInstructionSchema): Promise<IActionResult> {
    const { catchInstruction } = instruction || this.instruction;
    const result = await this.executeWithCatch(instruction || this.instruction);
    if (result.status === ActionResultStatus.Error && catchInstruction) {
      return this.execute(catchInstruction);
    }
    return result;
  }

  protected async executeWithCatch(instruction: IInstructionSchema): Promise<IActionResult> {
    const { action: actionName, params } = instruction;
    const action = this.actionManager.findAction(actionName)?.execute;
    if (!action) {
      return {
        status: ActionResultStatus.Error,
        error: { message: t('task.actionNotFound', { action: actionName }) },
      };
    }
    try {
      const { status, result, error } = await action(params, this.context);
      return {
        status,
        ...(status === ActionResultStatus.Error ? { error } : { result }),
      };
    } catch (error) {
      return {
        status: ActionResultStatus.Error,
        error: error as unknown as IActionResult['error'],
      };
    }
  }
}
