import { WebComponentRenderer } from './WebComponentRenderer.js';

export class ChatMessageRenderer {
  private webComponentRenderer: WebComponentRenderer;

  constructor(container: HTMLElement) {
    this.webComponentRenderer = new WebComponentRenderer(container);
  }

  /**
   * 渲染聊天消息，支持 Web Component
   * @param message 消息内容
   * @param messageContainer 消息容器元素
   */
  renderMessage(message: string, messageContainer: HTMLElement): void {
    // 检查是否包含 Web Component
    if (this.containsWebComponent(message)) {
      this.renderWebComponentMessage(message, messageContainer);
    } else {
      // 普通文本消息
      this.renderTextMessage(message, messageContainer);
    }
  }

  /**
   * 检查消息是否包含 Web Component
   */
  private containsWebComponent(message: string): boolean {
    return message.includes('<chart-component') || 
           message.includes('<script>') ||
           message.includes('customElements.define');
  }

  /**
   * 渲染包含 Web Component 的消息
   */
  private renderWebComponentMessage(message: string, container: HTMLElement): void {
    // 创建消息包装器
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'web-component-message';
    messageWrapper.style.cssText = `
      margin: 10px 0;
      padding: 10px;
      border-radius: 8px;
      background: #f8f9fa;
    `;

    // 添加消息标签
    const label = document.createElement('div');
    label.textContent = '📊 图表组件';
    label.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    `;
    messageWrapper.appendChild(label);

    // 创建 Web Component 容器
    const componentContainer = document.createElement('div');
    componentContainer.className = 'web-component-container';
    messageWrapper.appendChild(componentContainer);

    // 渲染 Web Component
    this.webComponentRenderer.render(message);

    container.appendChild(messageWrapper);
  }

  /**
   * 渲染普通文本消息
   */
  private renderTextMessage(message: string, container: HTMLElement): void {
    const messageElement = document.createElement('div');
    messageElement.className = 'text-message';
    messageElement.textContent = message;
    messageElement.style.cssText = `
      margin: 10px 0;
      padding: 10px;
      border-radius: 8px;
      background: #fff;
      border: 1px solid #e0e0e0;
      white-space: pre-wrap;
    `;
    
    container.appendChild(messageElement);
  }

  /**
   * 处理 MCP 工具调用结果
   * @param toolResult MCP 工具返回的结果
   * @param container 渲染容器
   */
  renderToolResult(toolResult: any, container: HTMLElement): void {
    if (toolResult.content && toolResult.content.length > 0) {
      const content = toolResult.content[0];
      
      if (content.type === 'text') {
        this.renderMessage(content.text, container);
      } else {
        // 处理其他类型的内容
        console.log('Unsupported content type:', content.type);
      }
    }
  }
} 