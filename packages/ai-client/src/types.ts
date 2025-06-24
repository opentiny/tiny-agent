export enum Role {
  FUNCTION = 'function',
  USER = 'user',
  ASSISTANT = 'assistant',
  DEVELOPER = 'developer',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export type ChatCompleteParams {

}

export type ErrorResponse = {
  code: number; // See "Error Handling" section
  message: string;
  metadata?: Record<string, unknown>; // Contains additional error information such as provider details, the raw error message, etc.
};

export type FunctionCall = {
  name: string;
  arguments: string;
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: FunctionCall;
};

export type NonChatChoice = {
  finish_reason: string | null;
  text: string;
  error?: ErrorResponse;
};

export type NonStreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  message: {
    content: string | null;
    role: Role;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type StreamingChoice = {
  finish_reason: string | null;
  native_finish_reason: string | null;
  delta: {
    content: string | null;
    role?: Role;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type ResponseUsage = {
  /** Including images and tools if any */
  prompt_tokens: number;
  /** The tokens generated */
  completion_tokens: number;
  /** Sum of the above two fields */
  total_tokens: number;
};

export type ChatCompleteResponse = {
  id: string;
  choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[];
  // choices: NonStreamingChoice[];
  created: number;
  model: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  system_fingerprint?: string;
  usage?: ResponseUsage;
};

export type Provider {
  
}

export interface IAIClient {
  provider: Provider;
  chatCompletions(payload: ChatCompleteParams): Promise<ChatCompleteResponse>
}