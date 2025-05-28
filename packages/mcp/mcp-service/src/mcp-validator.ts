import { v4 as uuidv4 } from 'uuid';

export class McpValidator {
  private codeList: string[];

  constructor() {
    this.codeList = [];
  }

  genVerifyCode() {
    const nonceCode = uuidv4();
    this.codeList.push(nonceCode);
    return nonceCode;
  }

  verify(code: string) {
    return !this.codeList.includes(code);
  }
}
