export class ChartComponent extends HTMLElement {
  private chartUrl: string = '';
  private chartType: string = '';
  private chartConfig: any = {};

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['chart-url', 'chart-type', 'chart-config'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'chart-url':
          this.chartUrl = newValue;
          break;
        case 'chart-type':
          this.chartType = newValue;
          break;
        case 'chart-config':
          try {
            this.chartConfig = JSON.parse(newValue);
          } catch (e) {
            this.chartConfig = {};
          }
          break;
      }
      this.render();
    }
  }

  connectedCallback() {
    this.chartUrl = this.getAttribute('chart-url') || '';
    this.chartType = this.getAttribute('chart-type') || '';
    const configAttr = this.getAttribute('chart-config');
    if (configAttr) {
      try {
        this.chartConfig = JSON.parse(configAttr);
      } catch (e) {
        this.chartConfig = {};
      }
    }
    this.render();
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 400px;
        }
        
        .chart-container {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 8px;
          border: 1px solid #ddd;
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
          font-size: 14px;
        }
        
        .error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ff4444;
          font-size: 14px;
          text-align: center;
        }
      </style>
      
      <div class="chart-container">
        ${this.chartUrl ? 
          `<iframe src="${this.chartUrl}" title="${this.chartType} chart"></iframe>` :
          `<div class="error">图表 URL 无效</div>`
        }
      </div>
    `;
  }
}

// 注册 Web Component
if (!customElements.get('chart-component')) {
  customElements.define('chart-component', ChartComponent);
} 