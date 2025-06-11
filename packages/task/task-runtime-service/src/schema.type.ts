export interface IInstructionSchema {
  action: string;
  params: Record<string, any>;
  catchInstruction?: IInstructionSchema;
}

export interface ITaskSchema {
  id: string;
  instructions: IInstructionSchema[];
}

export interface ITaskSchema {
  id: string;
  instructions: IInstructionSchema[];
}
