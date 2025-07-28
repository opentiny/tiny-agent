import { ChatMessageRenderer } from '../components/ChatMessageRenderer.js';

// 使用示例
export function setupWebComponentRendering() {
  // 获取聊天容器
  const chatContainer = document.getElementById('chat-container');
  if (!chatContainer) {
    console.error('Chat container not found');
    return;
  }

  // 创建消息渲染器
  const messageRenderer = new ChatMessageRenderer(chatContainer);

  // 示例：处理从 MCP 工具返回的 Web Component
  function handleToolResult(toolResult: any) {
    messageRenderer.renderToolResult(toolResult, chatContainer);
  }

  // 示例：处理流式消息
  function handleStreamMessage(message: string) {
    messageRenderer.renderMessage(message, chatContainer);
  }

  // 示例：模拟 MCP 工具返回的 Web Component
  const mockToolResult = {
    content: [
      {
        type: 'text',
        text: `
          <chart-component 
            chart-type="line"
            chart-url="https://chart.example.com/chart123"
            chart-config='{"data":[{"x":"2023","y":100},{"x":"2024","y":150}]}'
            style="width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 8px; margin: 10px 0;"
          ></chart-component>
          
          <script>
            if (!customElements.get('chart-component')) {
              customElements.define('chart-component', class extends HTMLElement {
                constructor() {
                  super();
                  this.attachShadow({ mode: 'open' });
                }
                
                connectedCallback() {
                  const chartType = this.getAttribute('chart-type');
                  const chartUrl = this.getAttribute('chart-url');
                  
                  this.shadowRoot.innerHTML = \`
                    <style>
                      :host { display: block; }
                      .chart-container { 
                        width: 100%; 
                        height: 100%; 
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        position: relative;
                      }
                      iframe { 
                        width: 100%; 
                        height: 100%; 
                        border: none; 
                      }
                      .loading {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: #666;
                      }
                    </style>
                    <div class="chart-container">
                      <iframe src="\${chartUrl}" title="\${chartType} chart" onload="this.parentElement.querySelector('.loading')?.remove()"></iframe>
                      <div class="loading">加载图表中...</div>
                    </div>
                  \`;
                }
              });
            }
          </script>
        `
      }
    ]
  };

  // 测试渲染
  handleToolResult(mockToolResult);

  return {
    handleToolResult,
    handleStreamMessage
  };
}

// 在 HTML 页面中使用
/*
<!DOCTYPE html>
<html>
<head>
    <title>Web Component Chat</title>
</head>
<body>
    <div id="chat-container"></div>
    
    <script type="module">
        import { setupWebComponentRendering } from './web-component-usage.js';
        
        // 初始化渲染器
        const { handleToolResult, handleStreamMessage } = setupWebComponentRendering();
        
        // 现在可以处理 MCP 工具返回的结果
        // handleToolResult(toolResult);
        // handleStreamMessage(message);
    </script>
</body>
</html>
*/ 