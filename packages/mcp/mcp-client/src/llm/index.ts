import axios from 'axios';
import { Agent } from 'node:https';

export interface LLMConfig {
  link: string;
  name: string;
  apiKey: string;
  model?: string;
}

class LLM {
  constructor(private config: LLMConfig) {
    this.config = config;
  }

  async chat(prompt: string, options?: Record<string, any>): Promise<string> {
    const response = await axios.post(this.config.link, prompt, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      httpsAgent: new Agent({
        rejectUnauthorized: false, // 禁用证书验证
      }),
    });
    
    return response.data;
  }
}

export default LLM;
