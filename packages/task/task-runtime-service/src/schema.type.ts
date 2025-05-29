export interface IInstructionSchema {
  action: string;
  params: { [key: string]: any };
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
 