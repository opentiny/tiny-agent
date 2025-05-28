# Instruction

指令执行器组件，负责执行单个指令并处理执行结果

- **用法**

```typescript
new Instruction(instruction: IInstructionSchema, actionManager: ActionManager, context: ISchedulerContext);
```

- **参数说明**
  - `instruction(IInstructionSchema)`: 指令模式
  - `actionManager(ActionManager)`: 动作管理器实例
  - `context(ISchedulerContext)`: 调度器上下文

## 方法

### execute

执行指令

- **用法**

```typescript
instruction.execute(): Promise<IActionResult>;
```

- **详细信息**

  执行指定的指令或构造函数中传入的指令。如果执行失败且存在 catchInstruction，则会执行 catchInstruction。

- **示例**

```typescript
const instruction = new Instruction(instructionSchema, actionManager, context);
const result = await instruction.execute();
```

- **参数说明**
  - `instruction?(IInstructionSchema)`: 可选的指令模式，如果不传则使用构造函数中的指令
- **返回值**
  - `Promise<IActionResult>`: 返回一个 Promise，解析为执行结果
    - 成功时返回: `{ status: ActionResultStatus.Success, result: any }`
    - 失败时返回: `{ status: ActionResultStatus.Error, error: { message: string } }`
