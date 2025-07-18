import { Response } from 'express';
// OpenAI Chat Completions API 类型定义（2024-10-21）
// 参考：https://platform.openai.com/docs/api-reference/chat/create
import type OpenAI from 'openai';

export type ChatCompletionRole = OpenAI.Chat.Completions.ChatCompletionRole;

export type ChatCompletionRequest = OpenAI.Chat.Completions.ChatCompletionCreateParams;

// export type ChatCompletionCreateParamsBase = OpenAI.Chat.Completions.ChatCompletionCreateParamsBase;

// export type ChatCompletionCreateParamsNonStreaming = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

// export type ChatCompletionCreateParamsStreaming = OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming;

// // messages
// export type ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;

// export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool;
export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;

// export {
//   Chat as Chat,
//   type ChatCompletion as ChatCompletion,
//   type ChatCompletionAssistantMessageParam as ChatCompletionAssistantMessageParam,
//   type ChatCompletionAudio as ChatCompletionAudio,
//   type ChatCompletionAudioParam as ChatCompletionAudioParam,
//   type ChatCompletionChunk as ChatCompletionChunk,
//   type ChatCompletionContentPart as ChatCompletionContentPart,
//   type ChatCompletionContentPartImage as ChatCompletionContentPartImage,
//   type ChatCompletionContentPartInputAudio as ChatCompletionContentPartInputAudio,
//   type ChatCompletionContentPartRefusal as ChatCompletionContentPartRefusal,
//   type ChatCompletionContentPartText as ChatCompletionContentPartText,
//   type ChatCompletionDeleted as ChatCompletionDeleted,
//   type ChatCompletionDeveloperMessageParam as ChatCompletionDeveloperMessageParam,
//   type ChatCompletionFunctionCallOption as ChatCompletionFunctionCallOption,
//   type ChatCompletionFunctionMessageParam as ChatCompletionFunctionMessageParam,
//   type ChatCompletionMessage as ChatCompletionMessage,
//   type ChatCompletionMessageParam as ChatCompletionMessageParam,
//   type ChatCompletionMessageToolCall as ChatCompletionMessageToolCall,
//   type ChatCompletionModality as ChatCompletionModality,
//   type ChatCompletionNamedToolChoice as ChatCompletionNamedToolChoice,
//   type ChatCompletionPredictionContent as ChatCompletionPredictionContent,
//   type ChatCompletionRole as ChatCompletionRole,
//   type ChatCompletionStoreMessage as ChatCompletionStoreMessage,
//   type ChatCompletionStreamOptions as ChatCompletionStreamOptions,
//   type ChatCompletionSystemMessageParam as ChatCompletionSystemMessageParam,
//   type ChatCompletionTokenLogprob as ChatCompletionTokenLogprob,
//   type ChatCompletionTool as ChatCompletionTool,
//   type ChatCompletionToolChoiceOption as ChatCompletionToolChoiceOption,
//   type ChatCompletionToolMessageParam as ChatCompletionToolMessageParam,
//   type ChatCompletionUserMessageParam as ChatCompletionUserMessageParam,
//   type CreateChatCompletionRequestMessage as CreateChatCompletionRequestMessage,
//   type ChatCompletionReasoningEffort as ChatCompletionReasoningEffort,
//   ChatCompletionsPage as ChatCompletionsPage,
//   type ChatCompletionCreateParams as ChatCompletionCreateParams,
//   type ChatCompletionCreateParamsNonStreaming as ChatCompletionCreateParamsNonStreaming,
//   type ChatCompletionCreateParamsStreaming as ChatCompletionCreateParamsStreaming,
//   type ChatCompletionUpdateParams as ChatCompletionUpdateParams,
//   type ChatCompletionListParams as ChatCompletionListParams,
// };

