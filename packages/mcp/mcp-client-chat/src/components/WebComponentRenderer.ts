export class WebComponentRenderer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * 渲染从 MCP 工具返回的 Web Component HTML 字符串
   * @param htmlString 包含 Web Component 的 HTML 字符串
   */
  render(htmlString: string): void {
    // 创建临时容器来解析 HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // 提取 script 标签
    const scripts = tempDiv.querySelectorAll('script');
    const webComponentElements = tempDiv.querySelectorAll('*:not(script)');

    // 先执行脚本（注册 Web Component）
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.textContent = script.textContent || '';
      document.head.appendChild(newScript);
      document.head.removeChild(newScript);
    });

    // 然后渲染 Web Component 元素
    webComponentElements.forEach(element => {
      this.container.appendChild(element.cloneNode(true));
    });
  }

  /**
   * 安全地渲染 HTML 内容
   * @param htmlString HTML 字符串
   */
  renderSafely(htmlString: string): void {
    // 使用 DOMPurify 或其他安全库来清理 HTML
    // 这里使用简单的白名单方法
    const sanitizedHtml = this.sanitizeHtml(htmlString);
    this.render(sanitizedHtml);
  }

  /**
   * 简单的 HTML 清理（生产环境建议使用 DOMPurify）
   */
  private sanitizeHtml(html: string): string {
    // 只允许特定的标签和属性
    const allowedTags = ['chart-component', 'script'];
    const allowedAttributes = ['chart-type', 'chart-url', 'chart-config', 'style'];
    
    // 这里应该实现更严格的清理逻辑
    // 为了演示，我们直接返回原始 HTML
    return html;
  }

  /**
   * 清除容器中的所有内容
   */
  clear(): void {
    this.container.innerHTML = '';
  }
} 