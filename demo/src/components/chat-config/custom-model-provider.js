import { BaseModelProvider } from '@opentiny/tiny-robot-kit';

export class CustomModelProvider extends BaseModelProvider {
  constructor(options, { toolCallHandler, validator, getClientId }) {
    super();
    this.options = options || {};
    this.toolCallHandler = toolCallHandler;
    this.validator = validator;
    this.getClientId = getClientId;
  }
  validateRequest() { }
  async getData(request) {
    this.validateRequest(request);

    const verifyCode = await this.validator?.genCode();
    const lastMessage = request.messages[request.messages.length - 1].content;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'connector-client-id': this.getClientId(),
        'mcp-verify-code': verifyCode,
      },
      body: JSON.stringify(this.options.memory ? { messages: request.messages } : { query: lastMessage }),
    };

    const response = await fetch(import.meta.env.VITE_CHAT_URL, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }
    return response;
  }

  async chat(request) {
    try {
      const response = await this.getData(request);
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let text = '';

      // 逐块读取流数据
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });

        try {
          const message = JSON.parse(chunk.slice(6));

          const extra = parsed.choices[0].delta.extra;
          if (this.toolCallHandler && extra && this.toolCallHandler.shouldHandle(extra)) {
            text += this.toolCallHandler.handlerStatic(extra);
            continue;
          }
          text += message.choices[0].delta.content;
        } catch (error) {
          text += '';
        }
      }

      return { choices: [{ message: { content: text } }] };
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await this.validator?.clearCode();
    }
  }

  async chatStream(request, handler) {
    const { onData, onDone, onError } = handler;
    let reader = null;
    try {
      const response = await this.getData(request);
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });
        // Process complete lines from buffer
        while (true) {
          const lineEnd = buffer.indexOf('\n');
          if (lineEnd === -1) break;
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const extra = parsed.choices[0].delta.extra;
              if (this.toolCallHandler && extra && this.toolCallHandler.shouldHandle(extra)) {
                this.toolCallHandler.handler(extra, handler);
                continue;
              }
              const content = parsed.choices[0].delta.content;
              if (content) {
                onData({ choices: [{ delta: { content } }] });
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }
      onDone();
    } catch (error) {
      onError(error);
      throw error;
    } finally {
      reader.cancel();
      this.validator?.clearCode();
    }
  }

  destroy() {
    this.toolCallHandler?.cleanup();
  }
}
